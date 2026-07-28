package com.caesaemc.juc.lesson11;

import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

/**
 * thenCompose 展平依赖异步调用，thenCombine 合并相互独立的结果。
 */
public final class CompositionDemo {

    private CompositionDemo() {
    }

    public static CompletableFuture<String> dependent(
            String userId,
            Function<String, CompletableFuture<String>> loadUser,
            Function<String, CompletableFuture<String>> loadOrders
    ) {
        return loadUser.apply(userId).thenCompose(loadOrders);
    }

    public static CompletableFuture<String> independent(
            CompletableFuture<String> profile,
            CompletableFuture<String> preference
    ) {
        return profile.thenCombine(preference, (left, right) -> left + ":" + right);
    }
}
