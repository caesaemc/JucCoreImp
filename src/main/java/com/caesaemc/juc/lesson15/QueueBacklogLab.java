package com.caesaemc.juc.lesson15;

import com.caesaemc.juc.lesson09.InstrumentedThreadPool;
import com.caesaemc.juc.lesson10.GracefulExecutor;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * 使用锁存器稳定制造“线程全忙、队列堆积”的观测窗口。
 */
public final class QueueBacklogLab {

    private QueueBacklogLab() {
    }

    public static InstrumentedThreadPool.MetricsSnapshot capture(
            int workers,
            int queuedTasks
    ) throws InterruptedException {
        if (workers <= 0 || queuedTasks <= 0) {
            throw new IllegalArgumentException("workers 和 queuedTasks 必须大于 0");
        }

        InstrumentedThreadPool pool = new InstrumentedThreadPool(
                workers,
                workers,
                queuedTasks,
                "backlog-lab"
        );
        CountDownLatch running = new CountDownLatch(workers);
        CountDownLatch release = new CountDownLatch(1);
        try {
            for (int index = 0; index < workers; index++) {
                pool.execute(() -> {
                    running.countDown();
                    try {
                        release.await();
                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
            if (!running.await(1, TimeUnit.SECONDS)) {
                throw new IllegalStateException("工作线程未按预期启动");
            }

            for (int index = 0; index < queuedTasks; index++) {
                pool.execute(() -> {
                    // 队列释放后立即完成。
                });
            }
            return pool.metrics();
        } finally {
            release.countDown();
            GracefulExecutor.shutdownAndAwait(pool, Duration.ofSeconds(1));
        }
    }
}
