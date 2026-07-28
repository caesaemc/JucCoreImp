package com.caesaemc.juc.lesson15;

import com.caesaemc.juc.lesson14.DeadlineBudget;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * 让一组 actor 先全部就绪，再同时开始，并使用共享 deadline 收集结果。
 */
public final class ConcurrentTestHarness {

    private ConcurrentTestHarness() {
    }

    public static <T> List<T> runTogether(
            List<? extends Callable<T>> actors,
            Duration timeout
    ) throws Exception {
        Objects.requireNonNull(actors, "actors");
        if (actors.isEmpty()) {
            return List.of();
        }

        DeadlineBudget budget = DeadlineBudget.after(timeout);
        CountDownLatch ready = new CountDownLatch(actors.size());
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newFixedThreadPool(
                actors.size(),
                Thread.ofPlatform().name("test-actor-", 0).factory()
        )) {
            List<Future<T>> futures = new ArrayList<>(actors.size());
            for (Callable<T> actor : actors) {
                Objects.requireNonNull(actor, "actor");
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    return actor.call();
                }));
            }

            if (!ready.await(budget.remainingNanos(), TimeUnit.NANOSECONDS)) {
                futures.forEach(future -> future.cancel(true));
                throw new TimeoutException("actor 未能在 deadline 前全部就绪");
            }
            start.countDown();

            List<T> results = new ArrayList<>(futures.size());
            try {
                for (Future<T> future : futures) {
                    results.add(future.get(
                            budget.remainingNanos(),
                            TimeUnit.NANOSECONDS
                    ));
                }
            } catch (InterruptedException | TimeoutException exception) {
                futures.forEach(future -> future.cancel(true));
                throw exception;
            } catch (ExecutionException exception) {
                futures.forEach(future -> future.cancel(true));
                throw rethrow(exception.getCause());
            }
            return List.copyOf(results);
        }
    }

    private static Exception rethrow(Throwable failure) throws Exception {
        if (failure instanceof Exception exception) {
            return exception;
        }
        if (failure instanceof Error error) {
            throw error;
        }
        return new RuntimeException(failure);
    }
}
