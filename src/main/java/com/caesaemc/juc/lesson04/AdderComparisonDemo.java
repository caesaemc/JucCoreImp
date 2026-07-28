package com.caesaemc.juc.lesson04;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * 只比较完成后的语义，不把 System.nanoTime 结果冒充可靠基准。
 */
public final class AdderComparisonDemo {

    private AdderComparisonDemo() {
    }

    public static Result run(int threadCount, int incrementsPerThread)
            throws InterruptedException {
        AtomicLong atomic = new AtomicLong();
        LongAdder adder = new LongAdder();
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threadCount);
        List<Thread> workers = new ArrayList<>();

        for (int index = 0; index < threadCount; index++) {
            Thread worker = new Thread(() -> {
                try {
                    start.await();
                    for (int iteration = 0; iteration < incrementsPerThread; iteration++) {
                        atomic.incrementAndGet();
                        adder.increment();
                    }
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            }, "adder-worker-" + index);
            workers.add(worker);
            worker.start();
        }

        start.countDown();
        done.await();
        long expected = Math.multiplyExact((long) threadCount, incrementsPerThread);
        return new Result(expected, atomic.get(), adder.sum());
    }

    public record Result(long expected, long atomicValue, long adderValue) {
    }
}
