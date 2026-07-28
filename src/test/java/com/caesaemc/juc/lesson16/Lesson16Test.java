package com.caesaemc.juc.lesson16;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson16Test {

    @Test
    @Timeout(5)
    void platformVersionShouldAggregateSuccessFailureAndTimeout() throws Exception {
        try (AggregationService service =
                     new PlatformAggregationService(3, 8, 2)) {
            AggregationResponse response = service.aggregate(
                    List.of(
                            call("inventory", () -> "in-stock", 200, true),
                            call("coupon", () -> {
                                throw new IllegalStateException("unavailable");
                            }, 200, false),
                            call("recommendation", () -> {
                                Thread.sleep(2_000);
                                return "late";
                            }, 30, false)
                    ),
                    Duration.ofMillis(500)
            );

            assertEquals(
                    List.of(
                            OutcomeStatus.SUCCESS,
                            OutcomeStatus.FAILED,
                            OutcomeStatus.TIMED_OUT
                    ),
                    response.outcomes().stream().map(CallOutcome::status).toList()
            );
            assertEquals("in-stock", response.successfulValues().get("inventory"));
            assertTrue(response.degraded());
            assertFalse(response.hasCriticalFailure());

            AggregationMetrics.MetricsSnapshot metrics = service.metrics();
            assertEquals(1, metrics.succeeded());
            assertEquals(1, metrics.failed());
            assertEquals(1, metrics.timedOut());
            assertEquals(3, metrics.terminalCount());
        }
    }

    @Test
    @Timeout(5)
    void virtualVersionShouldLimitRealResourceConcurrency() throws Exception {
        AtomicInteger externalActive = new AtomicInteger();
        AtomicInteger externalMax = new AtomicInteger();
        List<DownstreamCall> calls = new ArrayList<>();
        for (int index = 0; index < 24; index++) {
            calls.add(call("downstream-" + index, () -> {
                int current = externalActive.incrementAndGet();
                externalMax.accumulateAndGet(current, Math::max);
                try {
                    Thread.sleep(5);
                    return "ok";
                } finally {
                    externalActive.decrementAndGet();
                }
            }, 1_000, false));
        }

        try (AggregationService service = new VirtualAggregationService(3)) {
            AggregationResponse response =
                    service.aggregate(calls, Duration.ofSeconds(2));

            assertEquals(24, response.count(OutcomeStatus.SUCCESS));
            assertTrue(externalMax.get() <= 3);
            assertTrue(service.metrics().maxResourceCalls() <= 3);
        }
    }

    @Test
    @Timeout(5)
    void timeoutShouldInterruptCooperativeDownstream() throws Exception {
        CountDownLatch interrupted = new CountDownLatch(1);
        try (AggregationService service = new VirtualAggregationService(1)) {
            AggregationResponse response = service.aggregate(
                    List.of(call("slow", () -> {
                        try {
                            Thread.sleep(10_000);
                            return "late";
                        } catch (InterruptedException exception) {
                            interrupted.countDown();
                            throw exception;
                        }
                    }, 20, true)),
                    Duration.ofSeconds(1)
            );

            assertEquals(
                    OutcomeStatus.TIMED_OUT,
                    response.outcomes().getFirst().status()
            );
            assertTrue(interrupted.await(1, TimeUnit.SECONDS));
            assertTrue(response.hasCriticalFailure());
        }
    }

    @Test
    @Timeout(5)
    void boundedPlatformQueueShouldReportRejection() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        List<DownstreamCall> calls = new ArrayList<>();
        for (int index = 0; index < 8; index++) {
            calls.add(call("blocked-" + index, () -> {
                release.await();
                return "done";
            }, 200, false));
        }

        try (AggregationService service =
                     new PlatformAggregationService(1, 1, 1)) {
            try {
                AggregationResponse response =
                        service.aggregate(calls, Duration.ofMillis(50));

                assertTrue(response.count(OutcomeStatus.REJECTED) >= 1);
                assertEquals(8, response.outcomes().size());
                assertEquals(8, service.metrics().terminalCount());
            } finally {
                release.countDown();
            }
        }
    }

    @Test
    @Timeout(10)
    void loadRunnerShouldProduceTailLatencyAndConsistentMetrics() throws Exception {
        try (AggregationService service = new VirtualAggregationService(4)) {
            CapstoneLoadRunner.LoadReport report = CapstoneLoadRunner.run(
                    service,
                    30,
                    () -> List.of(
                            call("inventory", () -> "ok", 500, true),
                            call("recommendation", () -> "ok", 500, false)
                    ),
                    Duration.ofSeconds(2)
            );

            assertEquals(30, report.requests());
            assertEquals(0, report.degraded());
            assertEquals(60, report.metrics().succeeded());
            assertEquals(60, report.metrics().terminalCount());
            assertTrue(report.p95().compareTo(report.p50()) >= 0);
        }
    }

    @Test
    void serviceShouldRejectNewAggregationAfterClose() {
        AggregationService service = new VirtualAggregationService(1);
        service.close();

        assertThrows(IllegalStateException.class, () -> service.aggregate(
                List.of(call("x", () -> "x", 100, false)),
                Duration.ofSeconds(1)
        ));
    }

    private static DownstreamCall call(
            String name,
            java.util.concurrent.Callable<String> action,
            long timeoutMillis,
            boolean critical
    ) {
        return new DownstreamCall(
                name,
                action,
                Duration.ofMillis(timeoutMillis),
                critical
        );
    }
}
