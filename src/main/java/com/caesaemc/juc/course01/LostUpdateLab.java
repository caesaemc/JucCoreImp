package com.caesaemc.juc.course01;

import java.util.concurrent.CountDownLatch;

/**
 * 用两个同步点稳定构造一次丢失更新，而不是靠多跑几次碰运气。
 */
public final class LostUpdateLab {

    private LostUpdateLab() {
    }

    public static int reproduce() throws InterruptedException {
        State state = new State();
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

        Thread first = new Thread(increment, "course01-counter-a");
        Thread second = new Thread(increment, "course01-counter-b");
        first.start();
        second.start();

        bothThreadsRead.await();
        allowWriteBack.countDown();
        first.join();
        second.join();
        return state.value;
    }

    private static final class State {
        private int value;
    }
}
