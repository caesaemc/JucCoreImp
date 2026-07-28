package com.caesaemc.juc.lesson13;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson13Test {

    @Test
    @Timeout(5)
    void aggregatorShouldRunTasksOnVirtualThreads() throws InterruptedException {
        List<Callable<Boolean>> calls = List.of(
                () -> Thread.currentThread().isVirtual(),
                () -> Thread.currentThread().isVirtual()
        );

        List<VirtualThreadAggregator.Outcome<Boolean>> outcomes =
                VirtualThreadAggregator.invokeAll(calls, Duration.ofSeconds(1));

        assertTrue(outcomes.stream().allMatch(outcome -> Boolean.TRUE.equals(outcome.value())));
    }

    @Test
    @Timeout(5)
    void groupTimeoutShouldCancelSlowTask() throws InterruptedException {
        List<VirtualThreadAggregator.Outcome<String>> outcomes =
                VirtualThreadAggregator.invokeAll(List.of(() -> {
                    Thread.sleep(2_000);
                    return "late";
                }), Duration.ofMillis(20));

        assertTrue(outcomes.getFirst().cancelled());
    }

    @Test
    @Timeout(10)
    void semaphoreShouldLimitExternalResourceConcurrency() throws Exception {
        LimitedVirtualThreadService service = new LimitedVirtualThreadService(2);
        List<Callable<Integer>> calls = new ArrayList<>();
        for (int index = 0; index < 20; index++) {
            calls.add(() -> {
                Thread.sleep(10);
                return 1;
            });
        }

        assertEquals(20, service.invoke(calls).size());
        assertTrue(service.maxObservedConcurrency() <= 2);
    }
}
