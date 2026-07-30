package com.caesaemc.juc.course05;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Course05ExerciseTest {

    @Test
    void walksAllPoolPathsAndCancelsTimedOutTask() throws Exception {
        ThreadPoolDecisionLab.Snapshot snapshot = ThreadPoolDecisionLab.observe();
        assertEquals(2, snapshot.poolSize());
        assertEquals(1, snapshot.queuedTasks());
        assertTrue(snapshot.rejected());

        DeadlineRunner.Result<String> result = DeadlineRunner.run(() -> {
            Thread.sleep(100);
            return "late";
        }, Duration.ofMillis(10));
        assertEquals(DeadlineRunner.Status.TIMEOUT, result.status());
    }

    @Test
    void keepsPartialAsyncResultsAndSeparatesThreadsFromResourceCapacity()
            throws Exception {
        Map<String, java.util.function.Supplier<String>> calls = new LinkedHashMap<>();
        calls.put("profile", () -> "ok");
        calls.put("recommendation", () -> {
            throw new IllegalStateException("downstream failed");
        });

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var result = AsyncAggregator.aggregate(calls, executor);
            assertTrue(result.get("profile").success());
            assertTrue(!result.get("recommendation").success());
        }

        VirtualThreadLab.Result virtual = VirtualThreadLab.run(
                20, 3, Duration.ofMillis(2));
        assertEquals(20, virtual.values().size());
        assertTrue(virtual.maxObservedConcurrency() <= 3);
    }
}
