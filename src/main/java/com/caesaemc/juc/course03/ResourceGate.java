package com.caesaemc.juc.course03;

import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 线程数量和资源容量是两件事；Semaphore 单独表达真实资源的上限。
 */
public final class ResourceGate {

    private final Semaphore permits;
    private final AtomicInteger active = new AtomicInteger();
    private final AtomicInteger maxObserved = new AtomicInteger();

    public ResourceGate(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("capacity 必须大于 0");
        }
        permits = new Semaphore(capacity, true);
    }

    public <T> T call(Callable<T> action) throws Exception {
        Objects.requireNonNull(action, "action");
        permits.acquire();
        int now = active.incrementAndGet();
        maxObserved.accumulateAndGet(now, Math::max);
        try {
            return action.call();
        } finally {
            active.decrementAndGet();
            permits.release();
        }
    }

    public int maxObservedConcurrency() {
        return maxObserved.get();
    }

    public int availablePermits() {
        return permits.availablePermits();
    }
}
