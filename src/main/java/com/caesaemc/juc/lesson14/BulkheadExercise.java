package com.caesaemc.juc.lesson14;

import java.time.Duration;
import java.util.concurrent.Callable;

/**
 * 练习：为调用增加有界等待、许可释放和超时降级。
 */
public final class BulkheadExercise {

    public BulkheadExercise(int capacity) {
        // TODO：创建公平 Semaphore，并校验 capacity。
    }

    public <T> T call(
            Callable<T> action,
            Duration timeout,
            T fallback
    ) throws Exception {
        // TODO：限时获取许可，在 finally 中释放；超时时返回 fallback。
        return action.call();
    }
}
