package com.caesaemc.juc.course06;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;

import static com.caesaemc.juc.course06.ReliableAggregator.DownstreamCall;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Course06ExerciseTest {

    @Test
    void harnessStartsActorsTogetherAndKeepsInputOrder() throws Exception {
        List<Integer> values = ConcurrentTestHarness.run(
                4,
                Duration.ofSeconds(1),
                index -> () -> index
        );
        assertEquals(List.of(0, 1, 2, 3), values);
    }

    @Test
    void returnsPartialResultAndRestoresBulkheadPermit() throws Exception {
        List<DownstreamCall> calls = List.of(
                new DownstreamCall("profile", true, Duration.ofMillis(100), () -> "ok"),
                new DownstreamCall("optional", false, Duration.ofMillis(100), () -> {
                    throw new IllegalStateException("failed");
                })
        );

        try (ReliableAggregator aggregator = AggregationStrategies.platform(2, 2, 2)) {
            ReliableAggregator.Response response =
                    aggregator.aggregate(calls, Duration.ofSeconds(1));
            assertEquals(ReliableAggregator.OverallStatus.PARTIAL, response.status());
            assertEquals(ReliableAggregator.Status.SUCCESS, response.outcomes().get(0).status());
            assertEquals(ReliableAggregator.Status.FAILED, response.outcomes().get(1).status());
        }

        Course06Exercise bulkhead = new Course06Exercise(1);
        assertTrue(bulkhead.call(() -> "value", Duration.ofMillis(10)).isPresent());
        assertEquals(1, bulkhead.availablePermits());
    }
}
