package com.caesaemc.juc.course06;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.IntFunction;

/**
 * ready/start 两道门建立可控时序；准备和结果收集共享同一个总 deadline。
 */
public final class ConcurrentTestHarness {

    private ConcurrentTestHarness() {
    }

    public static <T> List<T> run(
            int actors,
            Duration timeout,
            IntFunction<Callable<T>> actorFactory
    ) throws Exception {
        DeadlineBudget budget = DeadlineBudget.start(timeout);
        CountDownLatch ready = new CountDownLatch(actors);
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<T>> futures = new ArrayList<>();
            for (int index = 0; index < actors; index++) {
                Callable<T> actor = actorFactory.apply(index);
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    return actor.call();
                }));
            }

            if (!ready.await(budget.remainingNanos(), TimeUnit.NANOSECONDS)) {
                cancelAll(futures);
                throw new IllegalStateException("actor 未在预算内准备完成");
            }
            start.countDown();

            List<T> results = new ArrayList<>();
            try {
                for (Future<T> future : futures) {
                    results.add(future.get(
                            budget.remainingNanos(),
                            TimeUnit.NANOSECONDS
                    ));
                }
                return List.copyOf(results);
            } catch (Exception failure) {
                cancelAll(futures);
                throw failure;
            }
        }
    }

    private static void cancelAll(List<? extends Future<?>> futures) {
        futures.forEach(future -> future.cancel(true));
    }
}
