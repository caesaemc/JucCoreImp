package com.caesaemc.juc.lesson13;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * 练习：虚拟线程数量不等于数据库连接容量，请增加 Semaphore 限制。
 */
public final class VirtualResourceExercise {

    private VirtualResourceExercise() {
    }

    public static <T> List<Future<T>> submitAllBroken(List<? extends Callable<T>> calls) {
        var executor = Executors.newVirtualThreadPerTaskExecutor();
        return calls.stream().map(executor::submit).toList();
    }

    public static <T> List<T> invokeAll(
            List<? extends Callable<T>> calls,
            int resourceCapacity
    ) throws Exception {
        // TODO：限定 executor 生命周期，并使用 Semaphore 限制资源并发。
        throw new UnsupportedOperationException("请完成 invokeAll");
    }
}
