package com.caesaemc.juc.lesson11;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CompositionExerciseTest {

    @Test
    @Disabled("完成 CompositionExercise.loadFlat 后启用")
    void shouldReturnFlatFuture() {
        CompletableFuture<String> flat =
                CompositionExercise.loadFlat(
                        "42",
                        id -> CompletableFuture.completedFuture("alice"),
                        name -> CompletableFuture.completedFuture("detail-" + name)
                );

        assertEquals("detail-alice", flat.join());
    }
}
