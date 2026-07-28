package com.caesaemc.juc.lesson06;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 对比一次性门闩和可循环屏障。
 */
public final class SynchronizerShowcase {

    private SynchronizerShowcase() {
    }

    public static int startTogether(int workerCount) throws InterruptedException {
        CountDownLatch ready = new CountDownLatch(workerCount);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(workerCount);
        AtomicInteger completed = new AtomicInteger();
        List<Thread> workers = new ArrayList<>();

        for (int index = 0; index < workerCount; index++) {
            Thread worker = Thread.ofPlatform().name("latch-worker-" + index).unstarted(() -> {
                ready.countDown();
                try {
                    start.await();
                    completed.incrementAndGet();
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
            workers.add(worker);
            worker.start();
        }

        if (!ready.await(5, TimeUnit.SECONDS)) {
            workers.forEach(Thread::interrupt);
            throw new IllegalStateException("工作线程未及时就绪");
        }
        start.countDown();
        if (!done.await(5, TimeUnit.SECONDS)) {
            workers.forEach(Thread::interrupt);
            throw new IllegalStateException("工作线程未及时结束");
        }
        return completed.get();
    }

    public static BarrierResult crossBarrier(int parties, int rounds)
            throws InterruptedException {
        AtomicInteger barrierTrips = new AtomicInteger();
        CyclicBarrier barrier = new CyclicBarrier(parties, barrierTrips::incrementAndGet);
        CountDownLatch done = new CountDownLatch(parties);
        AtomicInteger passed = new AtomicInteger();

        for (int index = 0; index < parties; index++) {
            Thread.ofPlatform().name("barrier-worker-" + index).start(() -> {
                try {
                    for (int round = 0; round < rounds; round++) {
                        barrier.await();
                        passed.incrementAndGet();
                    }
                } catch (Exception exception) {
                    throw new IllegalStateException(exception);
                } finally {
                    done.countDown();
                }
            });
        }

        if (!done.await(5, TimeUnit.SECONDS)) {
            throw new IllegalStateException("屏障实验超时");
        }
        return new BarrierResult(barrierTrips.get(), passed.get());
    }

    public record BarrierResult(int barrierTrips, int totalPasses) {
    }
}
