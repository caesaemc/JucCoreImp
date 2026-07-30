package com.caesaemc.juc.course05;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 虚拟线程负责廉价承载阻塞任务，Semaphore 仍负责保护昂贵的外部资源。
 */
public final class VirtualThreadLab {

    private VirtualThreadLab() {
    }

    public static Result run(int taskCount, int resourceCapacity, Duration work)
            throws Exception {
        Semaphore permits = new Semaphore(resourceCapacity);
        AtomicInteger active = new AtomicInteger();
        AtomicInteger maxObserved = new AtomicInteger();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var futures = new ArrayList<java.util.concurrent.Future<Integer>>();
            for (int index = 0; index < taskCount; index++) {
                int taskId = index;
                futures.add(executor.submit(() -> {
                    permits.acquire();
                    int now = active.incrementAndGet();
                    maxObserved.accumulateAndGet(now, Math::max);
                    try {
                        TimeUnit.NANOSECONDS.sleep(work.toNanos());
                        return taskId;
                    } finally {
                        active.decrementAndGet();
                        permits.release();
                    }
                }));
            }

            List<Integer> values = new ArrayList<>();
            for (var future : futures) {
                values.add(future.get());
            }
            return new Result(List.copyOf(values), maxObserved.get());
        }
    }

    public record Result(List<Integer> values, int maxObservedConcurrency) {
    }
}
