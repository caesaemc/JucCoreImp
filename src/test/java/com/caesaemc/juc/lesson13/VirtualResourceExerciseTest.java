package com.caesaemc.juc.lesson13;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VirtualResourceExerciseTest {

    @Test
    @Disabled("完成 VirtualResourceExercise.invokeAll 后启用")
    void shouldBoundResourceConcurrencyAndCloseExecutor() throws Exception {
        AtomicInteger active = new AtomicInteger();
        AtomicInteger maxObserved = new AtomicInteger();
        List<Callable<Integer>> calls = new ArrayList<>();
        for (int index = 0; index < 20; index++) {
            calls.add(() -> {
                int current = active.incrementAndGet();
                maxObserved.accumulateAndGet(current, Math::max);
                try {
                    Thread.sleep(10);
                    return 1;
                } finally {
                    active.decrementAndGet();
                }
            });
        }

        List<Integer> results = VirtualResourceExercise.invokeAll(calls, 2);

        assertEquals(20, results.size());
        assertTrue(maxObserved.get() <= 2);
    }
}
