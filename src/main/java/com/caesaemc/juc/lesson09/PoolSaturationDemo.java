package com.caesaemc.juc.lesson09;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;

/**
 * 确定性走过核心线程、入队、最大线程和拒绝四条路径。
 */
public final class PoolSaturationDemo {

    private PoolSaturationDemo() {
    }

    public static Result run() throws InterruptedException {
        InstrumentedThreadPool pool = new InstrumentedThreadPool(1, 2, 1, "saturation");
        CountDownLatch twoRunning = new CountDownLatch(2);
        CountDownLatch release = new CountDownLatch(1);
        Runnable blocker = () -> {
            twoRunning.countDown();
            try {
                release.await();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        };

        boolean fourthRejected;
        try {
            pool.execute(blocker);
            pool.execute(blocker);
            pool.execute(blocker);
            if (!twoRunning.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("两个工作线程未启动");
            }
            try {
                pool.execute(() -> {
                });
                fourthRejected = false;
            } catch (RejectedExecutionException expected) {
                fourthRejected = true;
            }
        } finally {
            release.countDown();
            pool.shutdown();
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {
                pool.shutdownNow();
            }
        }
        return new Result(fourthRejected, pool.metrics());
    }

    public record Result(
            boolean fourthTaskRejected,
            InstrumentedThreadPool.MetricsSnapshot metrics
    ) {
    }
}
