package com.caesaemc.juc.lesson14;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 虚拟线程承载任务，Semaphore 表达真实资源容量，DeadlineBudget 约束整组生命周期。
 */
public final class BoundedAggregator {

    private final Semaphore permits;
    private final AtomicInteger active = new AtomicInteger();
    private final AtomicInteger maxObserved = new AtomicInteger();

    public BoundedAggregator(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("capacity 必须大于 0");
        }
        permits = new Semaphore(capacity, true);
    }

    public <T> List<Outcome<T>> aggregate(
            List<? extends NamedTask<T>> tasks,
            Duration timeout
    ) throws InterruptedException {
        Objects.requireNonNull(tasks, "tasks");
        DeadlineBudget budget = DeadlineBudget.after(timeout);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<T>> futures = new ArrayList<>(tasks.size());
            for (NamedTask<T> task : tasks) {
                Objects.requireNonNull(task, "task");
                futures.add(executor.submit(() -> execute(task.action(), budget)));
            }

            List<Outcome<T>> outcomes = new ArrayList<>(tasks.size());
            try {
                for (int index = 0; index < futures.size(); index++) {
                    Future<T> future = futures.get(index);
                    NamedTask<T> task = tasks.get(index);
                    long remaining = budget.remainingNanos();
                    if (remaining == 0L) {
                        future.cancel(true);
                        outcomes.add(Outcome.timedOut(task.name()));
                        continue;
                    }

                    try {
                        outcomes.add(Outcome.success(
                                task.name(),
                                future.get(remaining, TimeUnit.NANOSECONDS)
                        ));
                    } catch (TimeoutException exception) {
                        future.cancel(true);
                        outcomes.add(Outcome.timedOut(task.name()));
                    } catch (java.util.concurrent.CancellationException exception) {
                        outcomes.add(Outcome.timedOut(task.name()));
                    } catch (ExecutionException exception) {
                        Throwable cause = exception.getCause();
                        if (cause instanceof TimeoutException) {
                            outcomes.add(Outcome.timedOut(task.name()));
                        } else {
                            outcomes.add(Outcome.failed(task.name(), cause));
                        }
                    }
                }
            } catch (InterruptedException exception) {
                futures.forEach(future -> future.cancel(true));
                throw exception;
            }
            return List.copyOf(outcomes);
        }
    }

    private <T> T execute(Callable<T> action, DeadlineBudget budget) throws Exception {
        long remaining = budget.remainingNanos();
        if (remaining == 0L
                || !permits.tryAcquire(remaining, TimeUnit.NANOSECONDS)) {
            throw new TimeoutException("等待资源许可时 deadline 已到");
        }

        int current = active.incrementAndGet();
        maxObserved.accumulateAndGet(current, Math::max);
        try {
            return action.call();
        } finally {
            active.decrementAndGet();
            permits.release();
        }
    }

    public int maxObservedConcurrency() {
        return maxObserved.get();
    }

    public record NamedTask<T>(String name, Callable<T> action) {

        public NamedTask {
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("name 不能为空");
            }
            Objects.requireNonNull(action, "action");
        }
    }

    public enum Status {
        SUCCESS,
        FAILED,
        TIMED_OUT
    }

    public record Outcome<T>(
            String name,
            Status status,
            T value,
            Throwable failure
    ) {

        public static <T> Outcome<T> success(String name, T value) {
            return new Outcome<>(name, Status.SUCCESS, value, null);
        }

        public static <T> Outcome<T> failed(String name, Throwable failure) {
            return new Outcome<>(name, Status.FAILED, null, failure);
        }

        public static <T> Outcome<T> timedOut(String name) {
            return new Outcome<>(name, Status.TIMED_OUT, null, null);
        }
    }
}
