package com.caesaemc.juc.course03;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Course03ExerciseTest {

    @Test
    void casAndAqsKeepUpdatesAtomic() throws InterruptedException {
        CasCounter cas = new CasCounter();
        AqsMutex mutex = new AqsMutex();
        AtomicInteger guarded = new AtomicInteger();
        List<Thread> threads = new ArrayList<>();

        for (int index = 0; index < 4; index++) {
            Thread thread = new Thread(() -> {
                for (int count = 0; count < 5_000; count++) {
                    cas.increment();
                    mutex.lock();
                    try {
                        guarded.set(guarded.get() + 1);
                    } finally {
                        mutex.unlock();
                    }
                }
            });
            threads.add(thread);
            thread.start();
        }

        for (Thread thread : threads) {
            thread.join();
        }
        assertEquals(20_000, cas.value());
        assertEquals(20_000, guarded.get());
    }

    @Test
    void interruptionStopsTheTaskAndSemaphoreLimitsTheResource() throws Exception {
        try (TwoPhaseTerminator terminator = new TwoPhaseTerminator()) {
            terminator.start();
            assertTrue(terminator.awaitRunning(Duration.ofSeconds(1)));
        }

        ResourceGate gate = new ResourceGate(2);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var futures = new ArrayList<java.util.concurrent.Future<Integer>>();
            for (int index = 0; index < 8; index++) {
                futures.add(executor.submit(() -> gate.call(() -> {
                    TimeUnit.MILLISECONDS.sleep(10);
                    return 1;
                })));
            }
            for (var future : futures) {
                assertEquals(1, future.get());
            }
        }
        assertTrue(gate.maxObservedConcurrency() <= 2);
        assertEquals(2, gate.availablePermits());
    }
}
