package com.caesaemc.juc.lesson03;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

class CancellationExerciseTest {

    @Test
    @Disabled("完成 CancellationExercise 后启用")
    void shouldStopAfterInterrupt() throws InterruptedException {
        Thread worker = Thread.ofPlatform().start(new CancellationExercise());
        worker.interrupt();
        worker.join(1_000);

        assertFalse(worker.isAlive());
    }
}
