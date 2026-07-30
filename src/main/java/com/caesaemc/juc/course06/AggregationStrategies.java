package com.caesaemc.juc.course06;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 执行载体可以替换，但两种策略都必须继续限制真实资源容量。
 */
public final class AggregationStrategies {

    private AggregationStrategies() {
    }

    public static ReliableAggregator platform(
            int workers,
            int queueCapacity,
            int resourceCapacity
    ) {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                workers,
                workers,
                0,
                TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(queueCapacity),
                new ThreadPoolExecutor.AbortPolicy()
        );
        return new ReliableAggregator(executor, resourceCapacity);
    }

    public static ReliableAggregator virtual(int resourceCapacity) {
        return new ReliableAggregator(
                Executors.newVirtualThreadPerTaskExecutor(),
                resourceCapacity
        );
    }
}
