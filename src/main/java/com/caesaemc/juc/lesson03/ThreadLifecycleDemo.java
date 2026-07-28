package com.caesaemc.juc.lesson03;

import java.util.concurrent.CountDownLatch;

/**
 * 观察 NEW、WAITING 和 TERMINATED 状态。
 */
public final class ThreadLifecycleDemo {

    private ThreadLifecycleDemo() {
    }

    public static StateTrace trace() throws InterruptedException {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        Thread worker = new Thread(() -> {
            entered.countDown();
            try {
                release.await();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }, "lifecycle-worker");

        Thread.State beforeStart = worker.getState();
        worker.start();
        entered.await();
        Thread.State whileWaiting = waitForState(worker, Thread.State.WAITING);
        release.countDown();
        worker.join();
        return new StateTrace(beforeStart, whileWaiting, worker.getState());
    }

    private static Thread.State waitForState(Thread thread, Thread.State expected)
            throws InterruptedException {
        long deadline = System.nanoTime() + 1_000_000_000L;
        Thread.State observed;
        while ((observed = thread.getState()) != expected && System.nanoTime() < deadline) {
            Thread.sleep(1);
        }
        return observed;
    }

    public record StateTrace(
            Thread.State beforeStart,
            Thread.State whileWaiting,
            Thread.State afterJoin
    ) {
    }
}
