package com.caesaemc.juc.lesson13;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 虚拟线程负责并发任务，Semaphore 单独表达外部资源容量。
 */
public final class LimitedVirtualThreadService {

    private final Semaphore permits;
    private final AtomicInteger active = new AtomicInteger();
    private final AtomicInteger maxObserved = new AtomicInteger();

    public LimitedVirtualThreadService(int resourceCapacity) {
        permits = new Semaphore(resourceCapacity);
    }

    public <T> List<T> invoke(List<? extends Callable<T>> calls) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<T>> futures = new ArrayList<>();
            for (Callable<T> call : calls) {
                futures.add(executor.submit(() -> {
                    permits.acquire();
                    int current = active.incrementAndGet();
                    maxObserved.accumulateAndGet(current, Math::max);
                    try {
                        return call.call();
                    } finally {
                        active.decrementAndGet();
                        permits.release();
                    }
                }));
            }

            List<T> results = new ArrayList<>();
            for (Future<T> future : futures) {
                results.add(future.get());
            }
            return List.copyOf(results);
        }
    }

    public int maxObservedConcurrency() {
        return maxObserved.get();
    }
}
