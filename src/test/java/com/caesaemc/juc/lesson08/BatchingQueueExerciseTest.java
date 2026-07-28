package com.caesaemc.juc.lesson08;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BatchingQueueExerciseTest {

    @Test
    @Disabled("完成 BatchingQueueExercise 后启用")
    void shouldTakeAtMostConfiguredBatchSize() throws InterruptedException {
        ArrayBlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);
        queue.addAll(List.of(1, 2, 3, 4, 5));
        BatchingQueueExercise<Integer> batcher = new BatchingQueueExercise<>(queue);

        assertEquals(List.of(1, 2, 3), batcher.takeBatch(3));
        assertEquals(2, queue.size());
    }
}
