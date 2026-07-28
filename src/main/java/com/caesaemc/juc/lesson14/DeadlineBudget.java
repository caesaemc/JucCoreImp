package com.caesaemc.juc.lesson14;

import java.time.Duration;
import java.util.Objects;

/**
 * 使用单调时钟表达一组操作共享的绝对截止时间。
 */
public final class DeadlineBudget {

    private final long deadlineNanos;

    private DeadlineBudget(long deadlineNanos) {
        this.deadlineNanos = deadlineNanos;
    }

    public static DeadlineBudget after(Duration timeout) {
        Objects.requireNonNull(timeout, "timeout");
        if (timeout.isNegative() || timeout.isZero()) {
            throw new IllegalArgumentException("timeout 必须大于 0");
        }

        long now = System.nanoTime();
        long timeoutNanos = timeout.toNanos();
        long deadline;
        try {
            deadline = Math.addExact(now, timeoutNanos);
        } catch (ArithmeticException ignored) {
            deadline = Long.MAX_VALUE;
        }
        return new DeadlineBudget(deadline);
    }

    public Duration remaining() {
        return Duration.ofNanos(remainingNanos());
    }

    public long remainingNanos() {
        return Math.max(0L, deadlineNanos - System.nanoTime());
    }

    public boolean expired() {
        return remainingNanos() == 0L;
    }

    public Duration cap(Duration requestedTimeout) {
        Objects.requireNonNull(requestedTimeout, "requestedTimeout");
        if (requestedTimeout.isNegative() || requestedTimeout.isZero()) {
            throw new IllegalArgumentException("requestedTimeout 必须大于 0");
        }
        return Duration.ofNanos(Math.min(remainingNanos(), requestedTimeout.toNanos()));
    }
}
