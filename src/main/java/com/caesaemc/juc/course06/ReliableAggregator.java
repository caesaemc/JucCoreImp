package com.caesaemc.juc.course06;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * 有界多下游聚合：共享总 deadline、资源许可、稳定终态和按输入顺序收集。
 */
public final class ReliableAggregator implements AutoCloseable {

    private final ExecutorService executor;
    private final Semaphore resources;

    public ReliableAggregator(ExecutorService executor, int resourceCapacity) {
        if (resourceCapacity <= 0) {
            throw new IllegalArgumentException("resourceCapacity 必须大于 0");
        }
        this.executor = executor;
        resources = new Semaphore(resourceCapacity);
    }

    public Response aggregate(List<DownstreamCall> calls, Duration requestTimeout)
            throws InterruptedException {
        DeadlineBudget budget = DeadlineBudget.start(requestTimeout);
        List<PendingCall> pending = new ArrayList<>();

        for (DownstreamCall call : calls) {
            try {
                Future<String> future = executor.submit(() -> invoke(call, budget));
                pending.add(new PendingCall(call, future, null));
            } catch (RejectedExecutionException rejection) {
                pending.add(new PendingCall(
                        call,
                        null,
                        new Outcome(call.name(), call.critical(), Status.REJECTED, null, rejection)
                ));
            }
        }

        List<Outcome> outcomes = new ArrayList<>();
        for (PendingCall item : pending) {
            if (item.immediate() != null) {
                outcomes.add(item.immediate());
                continue;
            }
            long waitNanos = budget.remainingNanos(item.call().timeout());
            if (waitNanos == 0) {
                item.future().cancel(true);
                outcomes.add(Outcome.timeout(item.call()));
                continue;
            }
            try {
                String value = item.future().get(waitNanos, TimeUnit.NANOSECONDS);
                outcomes.add(Outcome.success(item.call(), value));
            } catch (TimeoutException exception) {
                item.future().cancel(true);
                outcomes.add(Outcome.timeout(item.call()));
            } catch (ExecutionException exception) {
                outcomes.add(Outcome.failed(item.call(), exception.getCause()));
            }
        }
        return new Response(overallStatus(outcomes), List.copyOf(outcomes));
    }

    private String invoke(DownstreamCall call, DeadlineBudget budget) throws Exception {
        long waitNanos = budget.remainingNanos(call.timeout());
        if (waitNanos == 0 || !resources.tryAcquire(waitNanos, TimeUnit.NANOSECONDS)) {
            throw new ResourceTimeoutException();
        }
        try {
            return call.action().call();
        } finally {
            resources.release();
        }
    }

    private static OverallStatus overallStatus(List<Outcome> outcomes) {
        boolean criticalFailure = outcomes.stream()
                .anyMatch(outcome -> outcome.critical() && outcome.status() != Status.SUCCESS);
        if (criticalFailure) {
            return OverallStatus.FAILED;
        }
        boolean partial = outcomes.stream()
                .anyMatch(outcome -> outcome.status() != Status.SUCCESS);
        return partial ? OverallStatus.PARTIAL : OverallStatus.OK;
    }

    @Override
    public void close() throws InterruptedException {
        executor.shutdown();
        if (!executor.awaitTermination(1, TimeUnit.SECONDS)) {
            executor.shutdownNow();
            executor.awaitTermination(1, TimeUnit.SECONDS);
        }
    }

    public record DownstreamCall(
            String name,
            boolean critical,
            Duration timeout,
            Callable<String> action
    ) {
    }

    public record Outcome(
            String name,
            boolean critical,
            Status status,
            String value,
            Throwable failure
    ) {
        private static Outcome success(DownstreamCall call, String value) {
            return new Outcome(call.name(), call.critical(), Status.SUCCESS, value, null);
        }

        private static Outcome timeout(DownstreamCall call) {
            return new Outcome(call.name(), call.critical(), Status.TIMEOUT, null, null);
        }

        private static Outcome failed(DownstreamCall call, Throwable failure) {
            Status status = failure instanceof ResourceTimeoutException
                    ? Status.TIMEOUT
                    : Status.FAILED;
            return new Outcome(call.name(), call.critical(), status, null, failure);
        }
    }

    public record Response(OverallStatus status, List<Outcome> outcomes) {
    }

    private record PendingCall(
            DownstreamCall call,
            Future<String> future,
            Outcome immediate
    ) {
    }

    public enum Status {
        SUCCESS,
        TIMEOUT,
        REJECTED,
        FAILED
    }

    public enum OverallStatus {
        OK,
        PARTIAL,
        FAILED
    }

    private static final class ResourceTimeoutException extends TimeoutException {
    }
}
