package com.caesaemc.juc.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DeterministicLostUpdateDemoTest {

    @Test
    @Timeout(5)
    void shouldReproduceLostUpdateDeterministically() throws InterruptedException {
        DeterministicLostUpdateDemo.LostUpdateResult result =
                DeterministicLostUpdateDemo.runOnce();

        assertEquals(2, result.expected());
        assertEquals(1, result.actual());
    }
}
