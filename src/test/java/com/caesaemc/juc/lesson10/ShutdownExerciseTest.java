package com.caesaemc.juc.lesson10;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ShutdownExerciseTest {

    @Test
    @Disabled("完成 ShutdownExercise 后启用")
    void shouldWaitForTermination() {
        var executor = Executors.newSingleThreadExecutor();
        executor.submit(() -> {
        });

        assertTrue(ShutdownExercise.shutdown(executor, Duration.ofSeconds(1)));
    }
}
