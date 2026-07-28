package com.caesaemc.juc.lesson05;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertTrue;

class OneShotLatchExerciseTest {

    @Test
    @Disabled("完成 OneShotLatchExercise 后启用")
    void shouldReleaseAllWaitersAfterOpen() throws Exception {
        OneShotLatchExercise latch = new OneShotLatchExercise();
        CompletableFuture<Void> waiter = CompletableFuture.runAsync(() -> {
            try {
                latch.await();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(exception);
            }
        });

        latch.open();
        waiter.get(1, TimeUnit.SECONDS);
        assertTrue(latch.isOpen());
    }
}
