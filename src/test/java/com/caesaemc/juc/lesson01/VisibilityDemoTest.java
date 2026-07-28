package com.caesaemc.juc.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertTrue;

class VisibilityDemoTest {

    @Test
    @Timeout(5)
    void volatileFlagShouldProvideAVisibilityGuarantee() throws InterruptedException {
        VisibilityDemo.Observation observation = VisibilityDemo.observeVolatile(2_000);

        assertTrue(observation.stoppedWithinTimeout());
    }
}
