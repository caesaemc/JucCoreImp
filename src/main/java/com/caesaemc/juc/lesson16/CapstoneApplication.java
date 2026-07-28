package com.caesaemc.juc.lesson16;

import java.time.Duration;
import java.util.List;

public final class CapstoneApplication {

    private CapstoneApplication() {
    }

    public static void main(String[] args) throws Exception {
        List<DownstreamCall> calls = demoCalls();

        try (AggregationService platform =
                     new PlatformAggregationService(4, 16, 3)) {
            AggregationResponse response = platform.aggregate(
                    calls,
                    Duration.ofMillis(180)
            );
            platform.shutdown(Duration.ofSeconds(1));
            print("平台线程池", response, platform.metrics());
        }

        try (AggregationService virtual = new VirtualAggregationService(3)) {
            AggregationResponse response = virtual.aggregate(
                    calls,
                    Duration.ofMillis(180)
            );
            virtual.shutdown(Duration.ofSeconds(1));
            print("虚拟线程", response, virtual.metrics());
        }
    }

    private static List<DownstreamCall> demoCalls() {
        return List.of(
                new DownstreamCall(
                        "inventory",
                        SimulatedDownstream.successAfter(
                                Duration.ofMillis(20),
                                "in-stock"
                        ),
                        Duration.ofMillis(100),
                        true
                ),
                new DownstreamCall(
                        "price",
                        SimulatedDownstream.successAfter(
                                Duration.ofMillis(30),
                                "99.00"
                        ),
                        Duration.ofMillis(100),
                        true
                ),
                new DownstreamCall(
                        "recommendation",
                        SimulatedDownstream.successAfter(
                                Duration.ofMillis(300),
                                "you-may-like"
                        ),
                        Duration.ofMillis(60),
                        false
                ),
                new DownstreamCall(
                        "coupon",
                        SimulatedDownstream.failureAfter(
                                Duration.ofMillis(10),
                                "coupon service unavailable"
                        ),
                        Duration.ofMillis(80),
                        false
                )
        );
    }

    private static void print(
            String model,
            AggregationResponse response,
            AggregationMetrics.MetricsSnapshot metrics
    ) {
        System.out.println("\n" + model);
        response.outcomes().forEach(System.out::println);
        System.out.println("成功结果：" + response.successfulValues());
        System.out.println("是否降级：" + response.degraded());
        System.out.println("指标：" + metrics);
    }
}
