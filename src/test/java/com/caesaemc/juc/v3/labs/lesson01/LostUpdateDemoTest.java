package com.caesaemc.juc.v3.labs.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LostUpdateDemoTest {

    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void shouldDeterministicallyLoseOneOfTwoUpdates() throws InterruptedException {
        LostUpdateDemo.Result result = LostUpdateDemo.runOnce();

        assertEquals(2, result.expectedCompletedTasks());
        assertEquals(1, result.actualCompletedTasks());
        assertEquals(1, result.lostUpdates());
        assertEquals(2, result.observations().size());
        result.observations().forEach(observation -> {
            assertEquals(0, observation.localSnapshotRead());
            assertEquals(1, observation.heapValueWritten());
        });
    }
}
