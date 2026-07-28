package com.caesaemc.juc.lesson04;

import com.caesaemc.juc.lesson01.CounterRaceDemo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson04Test {

    @Test
    @Timeout(10)
    void varHandleCasCounterShouldNotLoseUpdates() throws InterruptedException {
        CounterRaceDemo.CounterResult result =
                CounterRaceDemo.runTrial(new VarHandleCounter(), 8, 50_000);

        assertTrue(result.isCorrect());
    }

    @Test
    void stampedReferenceShouldDetectAba() {
        AbaDemo.AbaResult result = AbaDemo.demonstrate();

        assertTrue(result.plainCasAccepted());
        assertFalse(result.stampedCasAccepted());
        assertEquals(2, result.finalStamp());
    }

    @Test
    @Timeout(10)
    void atomicAndAdderShouldReachExpectedFinalValue() throws InterruptedException {
        AdderComparisonDemo.Result result = AdderComparisonDemo.run(8, 20_000);

        assertEquals(result.expected(), result.atomicValue());
        assertEquals(result.expected(), result.adderValue());
    }
}
