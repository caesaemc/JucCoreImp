package com.caesaemc.juc.course06;

import java.time.Duration;

/**
 * 请求入口只计算一次绝对截止时间，所有步骤共享同一份剩余预算。
 */
public final class DeadlineBudget {

    private final long deadlineNanos;

    private DeadlineBudget(long deadlineNanos) {
        this.deadlineNanos = deadlineNanos;
    }

    public static DeadlineBudget start(Duration timeout) {
        if (timeout.isNegative() || timeout.isZero()) {
            throw new IllegalArgumentException("timeout 必须大于 0");
        }
        long now = System.nanoTime();
        return new DeadlineBudget(Math.addExact(now, timeout.toNanos()));
    }

    public long remainingNanos() {
        return Math.max(0, deadlineNanos - System.nanoTime());
    }

    public long remainingNanos(Duration stepLimit) {
        return Math.min(remainingNanos(), stepLimit.toNanos());
    }

    public boolean expired() {
        return remainingNanos() == 0;
    }
}
