package com.caesaemc.juc.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SynchronizedCounterTest {

    @Test
    @Timeout(10)
    void shouldKeepEveryUpdateUnderConcurrency() throws InterruptedException {
        CounterRaceDemo.CounterResult result =
                CounterRaceDemo.runTrial(new SynchronizedCounter(), 8, 25_000);

        assertTrue(result.isCorrect());
        assertEquals(200_000, result.actual());
    }
}
