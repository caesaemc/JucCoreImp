package com.caesaemc.juc.course05;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 稳定走过 ThreadPoolExecutor 的核心线程、队列、非核心线程和拒绝四条路径。
 */
public final class ThreadPoolDecisionLab {

    private ThreadPoolDecisionLab() {
    }

    public static Snapshot observe() throws InterruptedException {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                1,
                2,
                30,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(1),
                new ThreadPoolExecutor.AbortPolicy()
        );
        CountDownLatch twoWorkersStarted = new CountDownLatch(2);
        CountDownLatch release = new CountDownLatch(1);
        Runnable blockingTask = () -> {
            twoWorkersStarted.countDown();
            try {
                release.await();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        };

        try {
            executor.execute(blockingTask); // 1. 创建核心 Worker
            executor.execute(blockingTask); // 2. 核心忙，任务进入队列
            executor.execute(blockingTask); // 3. 队列满，创建非核心 Worker
            twoWorkersStarted.await();

            boolean rejected = false;
            try {
                executor.execute(() -> {
                }); // 4. Worker 和队列都满，执行拒绝策略
            } catch (RejectedExecutionException expected) {
                rejected = true;
            }
            return new Snapshot(executor.getPoolSize(), executor.getQueue().size(), rejected);
        } finally {
            release.countDown();
            executor.shutdown();
            executor.awaitTermination(1, TimeUnit.SECONDS);
        }
    }

    public record Snapshot(int poolSize, int queuedTasks, boolean rejected) {
    }
}
