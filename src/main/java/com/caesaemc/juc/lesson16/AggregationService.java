package com.caesaemc.juc.lesson16;

import com.caesaemc.juc.lesson10.GracefulExecutor;

import java.time.Duration;
import java.util.List;

public interface AggregationService extends AutoCloseable {

    AggregationResponse aggregate(
            List<DownstreamCall> calls,
            Duration overallTimeout
    ) throws InterruptedException;

    AggregationMetrics.MetricsSnapshot metrics();

    GracefulExecutor.ShutdownResult shutdown(Duration timeout);

    @Override
    void close();
}
