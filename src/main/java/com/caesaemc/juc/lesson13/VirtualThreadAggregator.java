package com.caesaemc.juc.lesson13;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * 每个任务一个虚拟线程，并为整组任务设置总超时。
 */
public final class VirtualThreadAggregator {

    private VirtualThreadAggregator() {
    }

    public static <T> List<Outcome<T>> invokeAll(
            List<? extends Callable<T>> tasks,
            Duration timeout
    ) throws InterruptedException {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<T>> futures = executor.invokeAll(
                    tasks,
                    timeout.toNanos(),
                    TimeUnit.NANOSECONDS
            );
            List<Outcome<T>> outcomes = new ArrayList<>(futures.size());
            for (Future<T> future : futures) {
                if (future.isCancelled()) {
                    outcomes.add(Outcome.cancelledOutcome());
                    continue;
                }
                try {
                    outcomes.add(Outcome.success(future.get()));
                } catch (ExecutionException exception) {
                    outcomes.add(Outcome.failure(exception.getCause()));
                }
            }
            return List.copyOf(outcomes);
        }
    }

    public record Outcome<T>(T value, Throwable failure, boolean cancelled) {

        public static <T> Outcome<T> success(T value) {
            return new Outcome<>(value, null, false);
        }

        public static <T> Outcome<T> failure(Throwable failure) {
            return new Outcome<>(null, failure, false);
        }

        public static <T> Outcome<T> cancelledOutcome() {
            return new Outcome<>(null, null, true);
        }

        public boolean succeeded() {
            return failure == null && !cancelled;
        }
    }
}
