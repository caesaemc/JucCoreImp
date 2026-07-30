package com.caesaemc.juc.course06;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * 第六课练习参考实现：容量、限时等待、降级和许可释放属于同一个调用协议。
 */
public final class Course06Exercise {

    private final Semaphore permits;

    public Course06Exercise(int capacity) {
        permits = new Semaphore(capacity);
    }

    public <T> Optional<T> call(Callable<T> action, Duration wait)
            throws Exception {
        if (!permits.tryAcquire(wait.toNanos(), TimeUnit.NANOSECONDS)) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(action.call());
        } finally {
            permits.release();
        }
    }

    public int availablePermits() {
        return permits.availablePermits();
    }
}
