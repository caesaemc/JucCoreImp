package com.caesaemc.juc.course05;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

/**
 * 独立调用并行发起，每个结果先归一化成 Outcome，再按输入顺序聚合。
 */
public final class AsyncAggregator {

    private AsyncAggregator() {
    }

    public static <T> Map<String, Outcome<T>> aggregate(
            Map<String, Supplier<T>> calls,
            Executor executor
    ) {
        List<Map.Entry<String, CompletableFuture<Outcome<T>>>> futures = calls.entrySet()
                .stream()
                .map(entry -> Map.entry(
                        entry.getKey(),
                        CompletableFuture.supplyAsync(entry.getValue(), executor)
                                .<Outcome<T>>handle((value, failure) ->
                                        failure == null
                                                ? Outcome.success(value)
                                                : Outcome.failed(failure))
                ))
                .toList();

        CompletableFuture.allOf(futures.stream()
                .map(Map.Entry::getValue)
                .toArray(CompletableFuture[]::new))
                .join();

        Map<String, Outcome<T>> result = new LinkedHashMap<>();
        futures.forEach(entry -> result.put(entry.getKey(), entry.getValue().join()));
        return Collections.unmodifiableMap(result);
    }

    public record Outcome<T>(boolean success, T value, Throwable failure) {
        public static <T> Outcome<T> success(T value) {
            return new Outcome<>(true, value, null);
        }

        public static <T> Outcome<T> failed(Throwable failure) {
            return new Outcome<>(false, null, failure);
        }
    }
}
