package com.caesaemc.juc.course05;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 第五课练习参考实现：显式写出线程数、队列容量、线程名和拒绝策略。
 */
public final class Course05Exercise {

    private Course05Exercise() {
    }

    public static ThreadPoolExecutor newBoundedExecutor(
            int coreThreads,
            int maxThreads,
            int queueCapacity
    ) {
        AtomicInteger sequence = new AtomicInteger();
        ThreadFactory factory = task -> {
            Thread thread = new Thread(task);
            thread.setName("course05-worker-" + sequence.incrementAndGet());
            return thread;
        };
        return new ThreadPoolExecutor(
                coreThreads,
                maxThreads,
                30,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(queueCapacity),
                factory,
                new ThreadPoolExecutor.AbortPolicy()
        );
    }
}
