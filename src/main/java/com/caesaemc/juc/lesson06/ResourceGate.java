package com.caesaemc.juc.lesson06;

import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 使用 Semaphore 限制对稀缺资源的并发访问。
 */
public final class ResourceGate {

    private final Semaphore permits;
    private final AtomicInteger active = new AtomicInteger();
    private final AtomicInteger maxObserved = new AtomicInteger();

    public ResourceGate(int maxConcurrency, boolean fair) {
        if (maxConcurrency <= 0) {
            throw new IllegalArgumentException("maxConcurrency 必须大于 0");
        }
        permits = new Semaphore(maxConcurrency, fair);
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
