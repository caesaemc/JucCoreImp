package com.caesaemc.juc.lesson16;

import java.util.concurrent.Executors;

/**
 * 每任务一个虚拟线程；真实下游容量仍由共享 Semaphore 保护。
 */
public final class VirtualAggregationService
        extends AbstractAggregationService {

    public VirtualAggregationService(int resourceCapacity) {
        super(
                Executors.newThreadPerTaskExecutor(
                        Thread.ofVirtual().name("virtual-downstream-", 0).factory()
                ),
                resourceCapacity,
                "virtual-aggregation-timeouts"
        );
    }
}
