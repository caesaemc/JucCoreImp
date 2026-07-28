package com.caesaemc.juc.lesson08;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class Lesson08Test {

    @Test
    @Timeout(10)
    void boundedPipelineShouldProcessAllInputs() throws InterruptedException {
        List<Integer> result = new ArrayList<>(
                BoundedPipeline.square(List.of(1, 2, 3, 4, 5), 2, 3)
        );
        result.sort(Integer::compareTo);

        assertEquals(List.of(1, 4, 9, 16, 25), result);
    }

    @Test
    @Timeout(5)
    void synchronousQueueShouldDirectlyHandoff() throws InterruptedException {
        assertEquals("payload", QueueSemanticsDemo.directHandoff("payload"));
    }
}
