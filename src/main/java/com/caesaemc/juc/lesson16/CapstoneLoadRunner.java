package com.caesaemc.juc.lesson16;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Supplier;

/**
 * 轻量负载驱动器。用于观察协议和尾延迟，不替代专业压测工具。
 */
public final class CapstoneLoadRunner {

    private CapstoneLoadRunner() {
    }

    public static LoadReport run(
            AggregationService service,
            int requests,
            Supplier<List<DownstreamCall>> callFactory,
            Duration requestTimeout
    ) throws Exception {
        Objects.requireNonNull(service, "service");
        Objects.requireNonNull(callFactory, "callFactory");
        if (requests <= 0) {
            throw new IllegalArgumentException("requests 必须大于 0");
        }

        try (var clients = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<AggregationResponse>> futures = new ArrayList<>(requests);
            for (int index = 0; index < requests; index++) {
                futures.add(clients.submit(
                        () -> service.aggregate(callFactory.get(), requestTimeout)
                ));
            }

            List<Long> latencies = new ArrayList<>(requests);
            int degraded = 0;
            int criticalFailures = 0;
            for (Future<AggregationResponse> future : futures) {
                AggregationResponse response = future.get();
                latencies.add(response.elapsed().toNanos());
                if (response.degraded()) {
                    degraded++;
                }
                if (response.hasCriticalFailure()) {
                    criticalFailures++;
                }
            }
            Collections.sort(latencies);
            return new LoadReport(
                    requests,
                    degraded,
                    criticalFailures,
                    Duration.ofNanos(percentile(latencies, 0.50)),
                    Duration.ofNanos(percentile(latencies, 0.95)),
                    service.metrics()
            );
        }
    }

    private static long percentile(List<Long> sorted, double quantile) {
        int index = (int) Math.ceil(sorted.size() * quantile) - 1;
        return sorted.get(Math.max(0, Math.min(index, sorted.size() - 1)));
    }

    public record LoadReport(
            int requests,
            int degraded,
            int criticalFailures,
            Duration p50,
            Duration p95,
            AggregationMetrics.MetricsSnapshot metrics
    ) {
    }
}
