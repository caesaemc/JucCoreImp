package com.caesaemc.juc.lesson16;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 有界平台线程池：线程和队列都满时立即拒绝，向上游形成背压信号。
 */
public final class PlatformAggregationService
        extends AbstractAggregationService {

    public PlatformAggregationService(
            int workers,
            int queueCapacity,
            int resourceCapacity
    ) {
        super(
                createExecutor(workers, queueCapacity),
                resourceCapacity,
                "platform-aggregation-timeouts"
        );
    }

    private static ThreadPoolExecutor createExecutor(
            int workers,
            int queueCapacity
    ) {
        if (workers <= 0 || queueCapacity <= 0) {
            throw new IllegalArgumentException(
                    "workers 和 queueCapacity 必须大于 0"
            );
        }
        return new ThreadPoolExecutor(
                workers,
                workers,
                0L,
                TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(queueCapacity),
                Thread.ofPlatform().name("platform-downstream-", 0).factory(),
                new ThreadPoolExecutor.AbortPolicy()
        );
    }
}
