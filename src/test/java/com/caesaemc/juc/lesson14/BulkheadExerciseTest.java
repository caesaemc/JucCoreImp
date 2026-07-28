package com.caesaemc.juc.lesson14;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BulkheadExerciseTest {

    @Test
    @Disabled("完成 BulkheadExercise 后启用")
    void shouldDegradeWhenCapacityCannotBeAcquiredInTime() throws Exception {
        BulkheadExercise bulkhead = new BulkheadExercise(1);
        CountDownLatch occupied = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> bulkhead.call(() -> {
                occupied.countDown();
                release.await();
                return "primary";
            }, Duration.ofSeconds(1), "fallback"));
            occupied.await();

            assertEquals("fallback", bulkhead.call(
                    () -> "too-late",
                    Duration.ofMillis(10),
                    "fallback"
            ));
            release.countDown();
        }
    }
}
