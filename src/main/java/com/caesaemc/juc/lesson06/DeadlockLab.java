package com.caesaemc.juc.lesson06;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.time.Duration;
import java.util.Arrays;
import java.util.concurrent.CountDownLatch;

/**
 * 手工运行的死锁实验。死锁线程为 daemon，不会阻止示例 JVM 退出。
 */
public final class DeadlockLab {

    private DeadlockLab() {
    }

    public static DetectionResult createAndDetect(Duration timeout) throws InterruptedException {
        Object firstLock = new Object();
        Object secondLock = new Object();
        CountDownLatch eachOwnsOne = new CountDownLatch(2);

        Thread first = deadlockingThread(
                "deadlock-first",
                firstLock,
                secondLock,
                eachOwnsOne
        );
        Thread second = deadlockingThread(
                "deadlock-second",
                secondLock,
                firstLock,
                eachOwnsOne
        );
        first.start();
        second.start();

        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        long deadline = System.nanoTime() + timeout.toNanos();
        long[] ids = null;
        while (ids == null && System.nanoTime() < deadline) {
            ids = bean.findDeadlockedThreads();
            if (ids == null) {
                Thread.sleep(10);
            }
        }

        boolean containsBoth = ids != null
                && Arrays.stream(ids).anyMatch(id -> id == first.threadId())
                && Arrays.stream(ids).anyMatch(id -> id == second.threadId());
        return new DetectionResult(containsBoth, ids == null ? 0 : ids.length);
    }

    private static Thread deadlockingThread(
            String name,
            Object ownFirst,
            Object waitForSecond,
            CountDownLatch eachOwnsOne
    ) {
        Thread thread = Thread.ofPlatform().name(name).unstarted(() -> {
            synchronized (ownFirst) {
                eachOwnsOne.countDown();
                try {
                    eachOwnsOne.await();
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    return;
                }
                synchronized (waitForSecond) {
                    throw new AssertionError("死锁成功建立后不应执行到这里");
                }
            }
        });
        thread.setDaemon(true);
        return thread;
    }

    public record DetectionResult(boolean targetThreadsDetected, int totalDeadlockedThreads) {
    }
}
