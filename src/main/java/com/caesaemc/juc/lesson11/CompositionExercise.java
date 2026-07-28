package com.caesaemc.juc.lesson11;

import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

/**
 * 练习：消除嵌套 CompletableFuture。
 */
public final class CompositionExercise {

    private CompositionExercise() {
    }

    public static CompletableFuture<CompletableFuture<String>> loadNested(
            String id,
            Function<String, CompletableFuture<String>> loadUser,
            Function<String, CompletableFuture<String>> loadDetail
    ) {
        // TODO：新增返回 CompletableFuture<String> 的 loadFlat，使用 thenCompose。
        return loadUser.apply(id).thenApply(loadDetail);
    }

    public static CompletableFuture<String> loadFlat(
            String id,
            Function<String, CompletableFuture<String>> loadUser,
            Function<String, CompletableFuture<String>> loadDetail
    ) {
        // TODO：使用 thenCompose 展平依赖调用。
        throw new UnsupportedOperationException("请完成 loadFlat");
    }
}
