package com.caesaemc.juc.lesson16;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.Callable;

/**
 * 一个下游调用及其独立时间上限和关键性。
 */
public record DownstreamCall(
        String name,
        Callable<String> action,
        Duration timeout,
        boolean critical
) {

    public DownstreamCall {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name 不能为空");
        }
        Objects.requireNonNull(action, "action");
        Objects.requireNonNull(timeout, "timeout");
        if (timeout.isNegative() || timeout.isZero()) {
            throw new IllegalArgumentException("timeout 必须大于 0");
        }
    }
}
