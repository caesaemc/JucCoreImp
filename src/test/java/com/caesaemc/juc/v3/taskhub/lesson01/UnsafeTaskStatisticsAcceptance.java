package com.caesaemc.juc.v3.taskhub.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * {@code TASK ACCEPTANCE}：文件名故意不匹配 Surefire 默认模式，默认 {@code mvn test}
 * 不会执行。学习者显式运行此类，直到所有 TODO 验收通过。
 */
class UnsafeTaskStatisticsAcceptance {

    @Test
    void shouldStartAtZeroAndCountSequentialCompletions() {
        UnsafeTaskStatistics statistics = new UnsafeTaskStatistics();

        assertEquals(0, statistics.completedTasks());
        statistics.recordCompletedTask();
        statistics.recordCompletedTask();

        assertEquals(2, statistics.completedTasks());
    }

    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void shouldExposeARepeatableLostUpdateWithoutFixingItYet() throws InterruptedException {
        CountDownLatch bothWorkersHaveRead = new CountDownLatch(2);
        UnsafeTaskStatistics statistics = new UnsafeTaskStatistics(ignored -> {
            bothWorkersHaveRead.countDown();
            await(bothWorkersHaveRead);
        });
        AtomicReference<Throwable> workerFailure = new AtomicReference<>();

        Thread workerA = worker("taskhub-worker-a", statistics, workerFailure);
        Thread workerB = worker("taskhub-worker-b", statistics, workerFailure);
        workerA.start();
        workerB.start();
        workerA.join();
        workerB.join();

        assertNull(workerFailure.get(), () -> "Worker 执行失败: " + workerFailure.get());
        assertEquals(1, statistics.completedTasks(),
                "两个 Worker 都读到 0 后再写 1，应稳定暴露一次丢失更新");
    }

    private static Thread worker(
            String name,
            UnsafeTaskStatistics statistics,
            AtomicReference<Throwable> workerFailure) {
        return Thread.ofPlatform().daemon(true).name(name).unstarted(() -> {
            try {
                statistics.recordCompletedTask();
            } catch (Throwable failure) {
                workerFailure.compareAndSet(null, failure);
            }
        });
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("TASK 验收线程被中断", interrupted);
        }
    }
}
