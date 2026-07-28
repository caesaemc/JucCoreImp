package com.caesaemc.juc.lesson06;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson06Test {

    @Test
    @Timeout(10)
    void semaphoreShouldBoundConcurrencyAndRestorePermits() throws Exception {
        ResourceGate gate = new ResourceGate(3, true);
        try (ExecutorService executor = Executors.newFixedThreadPool(12)) {
            List<Callable<Integer>> calls = new ArrayList<>();
            for (int index = 0; index < 30; index++) {
                calls.add(() -> gate.call(() -> {
                    Thread.sleep(5);
                    return 1;
                }));
            }
            for (Future<Integer> future : executor.invokeAll(calls)) {
                assertEquals(1, future.get());
            }
        }

        assertTrue(gate.maxObservedConcurrency() <= 3);
        assertEquals(3, gate.availablePermits());
    }

    @Test
    @Timeout(5)
    void latchAndBarrierShouldCoordinateExpectedParticipants() throws InterruptedException {
        assertEquals(6, SynchronizerShowcase.startTogether(6));
        assertEquals(
                new SynchronizerShowcase.BarrierResult(4, 12),
                SynchronizerShowcase.crossBarrier(3, 4)
        );
    }

    @Test
    void stampedPointShouldReadConsistentCoordinates() {
        StampedPoint point = new StampedPoint();
        point.move(3, 4);

        assertEquals(5.0, point.distanceFromOrigin());
    }
}
