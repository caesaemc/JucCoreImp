package com.caesaemc.juc.lesson12;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson12Test {

    @Test
    @Timeout(10)
    void forkJoinTaskShouldComputeExpectedSum() {
        int[] values = IntStream.rangeClosed(1, 100_000).toArray();
        try (ForkJoinPool pool = new ForkJoinPool(4)) {
            assertEquals(5_000_050_000L, pool.invoke(new ParallelSumTask(values)));
        }
    }

    @Test
    void selectorShouldMatchTaskShape() {
        assertEquals(
                TaskModelSelector.Model.FORK_JOIN,
                TaskModelSelector.select(
                        new TaskModelSelector.TaskShape(true, false, false, 100)
                )
        );
        assertEquals(
                TaskModelSelector.Model.VIRTUAL_THREADS,
                TaskModelSelector.select(
                        new TaskModelSelector.TaskShape(false, false, true, 10_000)
                )
        );
    }

    @Test
    @Timeout(5)
    void managedBlockerShouldComplete() throws InterruptedException {
        assertTrue(ManagedBlockerDemo.managedSleep(Duration.ofMillis(10)));
    }
}
