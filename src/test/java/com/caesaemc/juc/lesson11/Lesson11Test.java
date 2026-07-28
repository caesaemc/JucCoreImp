package com.caesaemc.juc.lesson11;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;

class Lesson11Test {

    @Test
    @Timeout(5)
    void aggregatorShouldPreserveSuccessFailureAndTimeout() {
        try (var executor = Executors.newFixedThreadPool(3)) {
            AsyncAggregator aggregator = new AsyncAggregator(executor);
            Map<String, Supplier<String>> sources = new LinkedHashMap<>();
            sources.put("success", () -> "ok");
            sources.put("failure", () -> {
                throw new IllegalStateException("boom");
            });
            sources.put("timeout", () -> {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                }
                return "late";
            });

            AsyncAggregator.Aggregation result =
                    aggregator.aggregate(sources, Duration.ofMillis(30)).join();

            assertEquals(1, result.successCount());
            assertEquals(2, result.failureCount());
        }
    }

    @Test
    void composeAndCombineShouldModelDifferentDependencies() {
        var user = Map.of("42", "alice");
        assertEquals(
                "orders-alice",
                CompositionDemo.dependent(
                        "42",
                        id -> java.util.concurrent.CompletableFuture.completedFuture(user.get(id)),
                        name -> java.util.concurrent.CompletableFuture.completedFuture("orders-" + name)
                ).join()
        );
        assertEquals(
                "profile:preference",
                CompositionDemo.independent(
                        java.util.concurrent.CompletableFuture.completedFuture("profile"),
                        java.util.concurrent.CompletableFuture.completedFuture("preference")
                ).join()
        );
    }
}
