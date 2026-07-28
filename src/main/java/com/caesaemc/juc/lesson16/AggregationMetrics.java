package com.caesaemc.juc.lesson16;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

/**
 * 无锁累计终态指标，瞬时活跃数使用 AtomicInteger。
 */
public final class AggregationMetrics {

    private final LongAdder submitted = new LongAdder();
    private final LongAdder started = new LongAdder();
    private final LongAdder succeeded = new LongAdder();
    private final LongAdder failed = new LongAdder();
    private final LongAdder timedOut = new LongAdder();
    private final LongAdder rejected = new LongAdder();
    private final LongAdder cancelled = new LongAdder();
    private final AtomicInteger activeResourceCalls = new AtomicInteger();
    private final AtomicInteger maxResourceCalls = new AtomicInteger();

    void submitted() {
        submitted.increment();
    }

    void started() {
        started.increment();
    }

    void enteredResource() {
        int current = activeResourceCalls.incrementAndGet();
        maxResourceCalls.accumulateAndGet(current, Math::max);
    }

    void leftResource() {
        activeResourceCalls.decrementAndGet();
    }

    void terminal(OutcomeStatus status) {
        switch (status) {
            case SUCCESS -> succeeded.increment();
            case FAILED -> failed.increment();
            case TIMED_OUT -> timedOut.increment();
            case REJECTED -> rejected.increment();
            case CANCELLED -> cancelled.increment();
        }
    }

    public MetricsSnapshot snapshot() {
        return new MetricsSnapshot(
                submitted.sum(),
                started.sum(),
                succeeded.sum(),
                failed.sum(),
                timedOut.sum(),
                rejected.sum(),
                cancelled.sum(),
                activeResourceCalls.get(),
                maxResourceCalls.get()
        );
    }

    public record MetricsSnapshot(
            long submitted,
            long started,
            long succeeded,
            long failed,
            long timedOut,
            long rejected,
            long cancelled,
            int activeResourceCalls,
            int maxResourceCalls
    ) {

        public long terminalCount() {
            return succeeded + failed + timedOut + rejected + cancelled;
        }
    }
}
