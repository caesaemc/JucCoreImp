package com.caesaemc.juc.lesson16;

import com.caesaemc.juc.lesson10.GracefulExecutor;
import com.caesaemc.juc.lesson14.DeadlineBudget;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 两种执行模型共享的 deadline、取消、结果协议、资源 Bulkhead 和指标实现。
 */
abstract class AbstractAggregationService implements AggregationService {

    private final ExecutorService workers;
    private final ScheduledExecutorService timeoutScheduler;
    private final Semaphore resourcePermits;
    private final AggregationMetrics metrics = new AggregationMetrics();
    private final AtomicBoolean closed = new AtomicBoolean();
    private GracefulExecutor.ShutdownResult shutdownResult;

    AbstractAggregationService(
            ExecutorService workers,
            int resourceCapacity,
            String schedulerName
    ) {
        this.workers = Objects.requireNonNull(workers, "workers");
        if (resourceCapacity <= 0) {
            throw new IllegalArgumentException("resourceCapacity 必须大于 0");
        }
        resourcePermits = new Semaphore(resourceCapacity, true);
        timeoutScheduler = Executors.newSingleThreadScheduledExecutor(
                Thread.ofPlatform()
                        .daemon(true)
                        .name(schedulerName)
                        .factory()
        );
    }

    @Override
    public final AggregationResponse aggregate(
            List<DownstreamCall> calls,
            Duration overallTimeout
    ) throws InterruptedException {
        ensureOpen();
        validateCalls(calls);

        long aggregationStarted = System.nanoTime();
        DeadlineBudget budget = DeadlineBudget.after(overallTimeout);
        CallOutcome[] outcomes = new CallOutcome[calls.size()];
        List<PendingCall> pending = new ArrayList<>(calls.size());

        for (int index = 0; index < calls.size(); index++) {
            DownstreamCall call = calls.get(index);
            long submittedAt = System.nanoTime();
            long timeoutNanos = Math.min(
                    call.timeout().toNanos(),
                    budget.remainingNanos()
            );
            if (timeoutNanos == 0L) {
                CallOutcome outcome = CallOutcome.timedOut(
                        call,
                        elapsedSince(submittedAt)
                );
                outcomes[index] = outcome;
                metrics.terminal(outcome.status());
                continue;
            }

            AtomicBoolean timeoutTriggered = new AtomicBoolean();
            try {
                Future<CallOutcome> future = workers.submit(
                        () -> invokeDownstream(call, submittedAt)
                );
                metrics.submitted();

                ScheduledFuture<?> timer;
                try {
                    timer = timeoutScheduler.schedule(() -> {
                        timeoutTriggered.set(true);
                        if (!future.cancel(true)) {
                            timeoutTriggered.set(false);
                        }
                    }, timeoutNanos, TimeUnit.NANOSECONDS);
                } catch (RejectedExecutionException exception) {
                    future.cancel(true);
                    CallOutcome outcome = CallOutcome.rejected(
                            call,
                            exception,
                            elapsedSince(submittedAt)
                    );
                    outcomes[index] = outcome;
                    metrics.terminal(outcome.status());
                    continue;
                }

                pending.add(new PendingCall(
                        index,
                        call,
                        submittedAt,
                        future,
                        timer,
                        timeoutTriggered,
                        new AtomicBoolean()
                ));
            } catch (RejectedExecutionException exception) {
                CallOutcome outcome = CallOutcome.rejected(
                        call,
                        exception,
                        elapsedSince(submittedAt)
                );
                outcomes[index] = outcome;
                metrics.terminal(outcome.status());
            }
        }

        try {
            for (PendingCall call : pending) {
                CallOutcome outcome = await(call, budget);
                call.timer().cancel(false);
                outcomes[call.index()] = outcome;
                recordOnce(call, outcome.status());
            }
        } catch (InterruptedException exception) {
            cancelPending(pending);
            throw exception;
        }

        return new AggregationResponse(
                Arrays.asList(outcomes),
                elapsedSince(aggregationStarted)
        );
    }

    private CallOutcome invokeDownstream(
            DownstreamCall call,
            long submittedAt
    ) {
        metrics.started();
        boolean acquired = false;
        try {
            resourcePermits.acquire();
            acquired = true;
            metrics.enteredResource();
            return CallOutcome.success(
                    call,
                    call.action().call(),
                    elapsedSince(submittedAt)
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return CallOutcome.cancelled(call, elapsedSince(submittedAt));
        } catch (Throwable failure) {
            return CallOutcome.failed(call, failure, elapsedSince(submittedAt));
        } finally {
            if (acquired) {
                metrics.leftResource();
                resourcePermits.release();
            }
        }
    }

    private CallOutcome await(
            PendingCall pending,
            DeadlineBudget budget
    ) throws InterruptedException {
        try {
            if (pending.future().isDone()) {
                return pending.future().get();
            }

            long remaining = budget.remainingNanos();
            if (remaining == 0L) {
                pending.timeoutTriggered().set(true);
                pending.future().cancel(true);
                return CallOutcome.timedOut(
                        pending.call(),
                        elapsedSince(pending.submittedAt())
                );
            }
            return pending.future().get(remaining, TimeUnit.NANOSECONDS);
        } catch (TimeoutException exception) {
            pending.timeoutTriggered().set(true);
            pending.future().cancel(true);
            return CallOutcome.timedOut(
                    pending.call(),
                    elapsedSince(pending.submittedAt())
            );
        } catch (CancellationException exception) {
            if (pending.timeoutTriggered().get()) {
                return CallOutcome.timedOut(
                        pending.call(),
                        elapsedSince(pending.submittedAt())
                );
            }
            return CallOutcome.cancelled(
                    pending.call(),
                    elapsedSince(pending.submittedAt())
            );
        } catch (ExecutionException exception) {
            return CallOutcome.failed(
                    pending.call(),
                    exception.getCause(),
                    elapsedSince(pending.submittedAt())
            );
        }
    }

    private void cancelPending(List<PendingCall> pending) {
        for (PendingCall call : pending) {
            call.timer().cancel(false);
            call.future().cancel(true);
            recordOnce(call, OutcomeStatus.CANCELLED);
        }
    }

    private void recordOnce(PendingCall call, OutcomeStatus status) {
        if (call.terminalRecorded().compareAndSet(false, true)) {
            metrics.terminal(status);
        }
    }

    private static void validateCalls(List<DownstreamCall> calls) {
        Objects.requireNonNull(calls, "calls");
        Set<String> names = new HashSet<>();
        for (DownstreamCall call : calls) {
            Objects.requireNonNull(call, "call");
            if (!names.add(call.name())) {
                throw new IllegalArgumentException(
                        "下游名称必须唯一：" + call.name()
                );
            }
        }
    }

    private void ensureOpen() {
        if (closed.get()) {
            throw new IllegalStateException("聚合服务已经关闭");
        }
    }

    @Override
    public final AggregationMetrics.MetricsSnapshot metrics() {
        return metrics.snapshot();
    }

    @Override
    public final synchronized GracefulExecutor.ShutdownResult shutdown(
            Duration timeout
    ) {
        Objects.requireNonNull(timeout, "timeout");
        if (shutdownResult != null) {
            return shutdownResult;
        }
        closed.set(true);
        shutdownResult = GracefulExecutor.shutdownAndAwait(workers, timeout);
        timeoutScheduler.shutdownNow();
        return shutdownResult;
    }

    @Override
    public final void close() {
        shutdown(Duration.ofSeconds(2));
    }

    private static Duration elapsedSince(long startedNanos) {
        return Duration.ofNanos(Math.max(0L, System.nanoTime() - startedNanos));
    }

    private record PendingCall(
            int index,
            DownstreamCall call,
            long submittedAt,
            Future<CallOutcome> future,
            ScheduledFuture<?> timer,
            AtomicBoolean timeoutTriggered,
            AtomicBoolean terminalRecorded
    ) {
    }
}
