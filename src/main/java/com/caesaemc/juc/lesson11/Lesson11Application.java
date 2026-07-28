package com.caesaemc.juc.lesson11;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

public final class Lesson11Application {

    private Lesson11Application() {
    }

    public static void main(String[] args) {
        try (ExecutorService executor = Executors.newFixedThreadPool(3)) {
            AsyncAggregator aggregator = new AsyncAggregator(executor);
            Map<String, Supplier<String>> sources = new LinkedHashMap<>();
            sources.put("profile", () -> "profile-ok");
            sources.put("orders", () -> "orders-ok");
            sources.put("risk", () -> {
                throw new IllegalStateException("risk unavailable");
            });

            System.out.println(
                    aggregator.aggregate(sources, Duration.ofSeconds(1)).join()
            );
        }
    }
}
