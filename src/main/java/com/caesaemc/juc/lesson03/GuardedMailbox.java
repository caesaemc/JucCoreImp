package com.caesaemc.juc.lesson03;

import java.time.Duration;

/**
 * 使用 wait/notifyAll 实现带超时的保护性暂停。
 */
public final class GuardedMailbox<T> {

    private T value;
    private boolean completed;

    public synchronized T await(Duration timeout) throws InterruptedException {
        long remainingNanos = timeout.toNanos();
        long deadline = System.nanoTime() + remainingNanos;

        while (!completed && remainingNanos > 0) {
            long millis = remainingNanos / 1_000_000L;
            int nanos = (int) (remainingNanos % 1_000_000L);
            wait(millis, nanos);
            remainingNanos = deadline - System.nanoTime();
        }
        return completed ? value : null;
    }

    public synchronized boolean complete(T result) {
        if (completed) {
            return false;
        }
        value = result;
        completed = true;
        notifyAll();
        return true;
    }
}
