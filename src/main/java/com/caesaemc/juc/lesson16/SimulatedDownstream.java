package com.caesaemc.juc.lesson16;

import java.time.Duration;
import java.util.concurrent.Callable;

public final class SimulatedDownstream {

    private SimulatedDownstream() {
    }

    public static Callable<String> successAfter(
            Duration latency,
            String value
    ) {
        return () -> {
            Thread.sleep(latency);
            return value;
        };
    }

    public static Callable<String> failureAfter(
            Duration latency,
            String message
    ) {
        return () -> {
            Thread.sleep(latency);
            throw new IllegalStateException(message);
        };
    }
}
