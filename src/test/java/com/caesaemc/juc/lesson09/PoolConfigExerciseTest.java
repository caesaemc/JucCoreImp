package com.caesaemc.juc.lesson09;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PoolConfigExerciseTest {

    @Test
    @Disabled("完成 PoolConfigExercise 后启用")
    void shouldCreateExplicitBoundedPool() {
        ExecutorService executor = PoolConfigExercise.create();
        try {
            ThreadPoolExecutor pool = assertInstanceOf(ThreadPoolExecutor.class, executor);
            assertTrue(pool.getQueue().remainingCapacity() < Integer.MAX_VALUE);
        } finally {
            executor.shutdownNow();
        }
    }
}
