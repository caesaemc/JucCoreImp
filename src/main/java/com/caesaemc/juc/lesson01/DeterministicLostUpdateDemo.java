package com.caesaemc.juc.lesson01;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * 把“读取 → 计算 → 写回”三个步骤拆开，以确定性方式复现丢失更新。
 */
public final class DeterministicLostUpdateDemo {

    private DeterministicLostUpdateDemo() {
    }

    public static LostUpdateResult runOnce() throws InterruptedException {
        SharedState state = new SharedState();
        CountDownLatch bothThreadsRead = new CountDownLatch(2);
        CountDownLatch allowWriteBack = new CountDownLatch(1);

        Runnable increment = () -> {
            int snapshot = state.value;
            bothThreadsRead.countDown();
            try {
                allowWriteBack.await();
                state.value = snapshot + 1;
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        };

        Thread first = new Thread(increment, "lost-update-1");
        Thread second = new Thread(increment, "lost-update-2");
        first.start();
        second.start();

        try {
            if (!bothThreadsRead.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("两个线程未能及时读取共享值");
            }
        } finally {
            allowWriteBack.countDown();
        }

        first.join();
        second.join();
        return new LostUpdateResult(2, state.value);
    }

    public static void main(String[] args) throws InterruptedException {
        LostUpdateResult result = runOnce();
        System.out.printf(
                "两个线程各执行一次 +1：期望=%d，实际=%d%n",
                result.expected(),
                result.actual()
        );
    }

    private static final class SharedState {
        private int value;
    }

    public record LostUpdateResult(int expected, int actual) {
    }
}
