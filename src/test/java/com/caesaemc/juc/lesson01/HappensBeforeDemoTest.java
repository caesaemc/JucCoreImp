package com.caesaemc.juc.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HappensBeforeDemoTest {

    @Test
    @Timeout(5)
    void startAndJoinShouldPublishPlainFieldWrites() throws InterruptedException {
        HappensBeforeDemo.HappensBeforeResult result = HappensBeforeDemo.demonstrate();

        assertEquals(42, result.observedByWorker());
        assertEquals(84, result.outputAfterJoin());
    }
}
