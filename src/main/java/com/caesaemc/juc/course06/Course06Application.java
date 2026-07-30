package com.caesaemc.juc.course06;

import java.time.Duration;
import java.util.List;

import static com.caesaemc.juc.course06.ReliableAggregator.DownstreamCall;

public final class Course06Application {

    private Course06Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        List<DownstreamCall> calls = List.of(
                new DownstreamCall("profile", true, Duration.ofMillis(100), () -> "profile-ok"),
                new DownstreamCall("recommendation", false, Duration.ofMillis(100), () -> {
                    throw new IllegalStateException("simulated failure");
                })
        );

        try (ReliableAggregator aggregator = AggregationStrategies.virtual(2)) {
            ReliableAggregator.Response response =
                    aggregator.aggregate(calls, Duration.ofMillis(200));
            System.out.printf("聚合状态=%s，结果=%s%n", response.status(), response.outcomes());
        }
    }
}
