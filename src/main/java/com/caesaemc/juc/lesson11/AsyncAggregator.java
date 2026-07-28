package com.caesaemc.juc.lesson11;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 使用自定义 Executor 并行调用多个来源，保留成功、失败和超时结果。
 */
public final class AsyncAggregator {

    private final Executor executor;

    public AsyncAggregator(Executor executor) {
        this.executor = Objects.requireNonNull(executor, "executor");
    }

    public CompletableFuture<Aggregation> aggregate(
            Map<String, Supplier<String>> sources,
            Duration perSourceTimeout
    ) {
        Map<String, CompletableFuture<Outcome>> outcomes = new LinkedHashMap<>();
        sources.forEach((name, source) -> {
            CompletableFuture<Outcome> outcome = CompletableFuture
                    .supplyAsync(source, executor)
                    .orTimeout(perSourceTimeout.toNanos(), TimeUnit.NANOSECONDS)
                    .handle((value, failure) -> failure == null
                            ? Outcome.success(name, value)
                            : Outcome.failure(name, unwrap(failure)));
            outcomes.put(name, outcome);
        });

        CompletableFuture<?>[] all = outcomes.values()
                .toArray(CompletableFuture[]::new);
        return CompletableFuture.allOf(all)
                .thenApply(ignored -> {
                    List<Outcome> ordered = new ArrayList<>();
                    outcomes.values().forEach(future -> ordered.add(future.join()));
                    return new Aggregation(List.copyOf(ordered));
                });
    }

    private static Throwable unwrap(Throwable failure) {
        Throwable current = failure;
        while (current.getCause() != null
                && (current instanceof java.util.concurrent.CompletionException
                || current instanceof java.util.concurrent.ExecutionException)) {
            current = current.getCause();
        }
        return current;
    }

    public record Outcome(String source, String value, Throwable failure) {

        public static Outcome success(String source, String value) {
            return new Outcome(source, value, null);
        }

        public static Outcome failure(String source, Throwable failure) {
            return new Outcome(source, null, failure);
        }

        public boolean succeeded() {
            return failure == null;
        }
    }

    public record Aggregation(List<Outcome> outcomes) {

        public long successCount() {
            return outcomes.stream().filter(Outcome::succeeded).count();
        }

        public long failureCount() {
            return outcomes.size() - successCount();
        }
    }
}
