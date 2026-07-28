package com.caesaemc.juc.lesson05;

import java.util.concurrent.locks.AbstractQueuedSynchronizer;

/**
 * 练习：补全一个只允许从关闭变为打开一次的共享模式同步器。
 */
public final class OneShotLatchExercise {

    private final Sync sync = new Sync();

    public void await() throws InterruptedException {
        // TODO：使用共享模式可中断获取。
    }

    public void open() {
        // TODO：释放共享状态并传播唤醒。
    }

    public boolean isOpen() {
        return sync.getStateValue() == 1;
    }

    private static final class Sync extends AbstractQueuedSynchronizer {

        @Override
        protected int tryAcquireShared(int ignored) {
            return getState() == 1 ? 1 : -1;
        }

        @Override
        protected boolean tryReleaseShared(int ignored) {
            setState(1);
            return true;
        }

        private int getStateValue() {
            return getState();
        }
    }
}
