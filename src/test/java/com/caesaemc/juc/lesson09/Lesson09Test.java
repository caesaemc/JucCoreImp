package com.caesaemc.juc.lesson09;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static com.caesaemc.juc.lesson09.ThreadPoolDecisionModel.Decision.ENQUEUE;
import static com.caesaemc.juc.lesson09.ThreadPoolDecisionModel.Decision.REJECT;
import static com.caesaemc.juc.lesson09.ThreadPoolDecisionModel.Decision.START_CORE_WORKER;
import static com.caesaemc.juc.lesson09.ThreadPoolDecisionModel.Decision.START_NON_CORE_WORKER;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson09Test {

    @Test
    void decisionModelShouldCoverExecutePaths() {
        assertEquals(START_CORE_WORKER, ThreadPoolDecisionModel.decide(true, 0, 1, 2, true));
        assertEquals(ENQUEUE, ThreadPoolDecisionModel.decide(true, 1, 1, 2, true));
        assertEquals(START_NON_CORE_WORKER, ThreadPoolDecisionModel.decide(true, 1, 1, 2, false));
        assertEquals(REJECT, ThreadPoolDecisionModel.decide(true, 2, 1, 2, false));
        assertEquals(REJECT, ThreadPoolDecisionModel.decide(false, 0, 1, 2, true));
    }

    @Test
    @Timeout(10)
    void saturationShouldRejectFourthTaskAndRecordMetrics() throws InterruptedException {
        PoolSaturationDemo.Result result = PoolSaturationDemo.run();

        assertTrue(result.fourthTaskRejected());
        assertEquals(1, result.metrics().rejected());
        assertEquals(3, result.metrics().completed());
    }
}
