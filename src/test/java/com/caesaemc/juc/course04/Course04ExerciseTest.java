package com.caesaemc.juc.course04;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class Course04ExerciseTest {

    @Test
    void reproducesBrokenCompoundActionAndFixesItWithAtomicMapApi() {
        AtomicInteger loads = new AtomicInteger();
        Course04Exercise<String, String> cache = new Course04Exercise<>();

        IntStream.range(0, 1_000).parallel().forEach(index ->
                cache.load("profile", key -> "value-" + loads.incrementAndGet()));

        assertEquals(1, loads.get());
    }

    @Test
    void boundedQueueMovesDataAndDirectQueueHandsItOff() throws InterruptedException {
        assertEquals(List.of("A", "B", "C"),
                BoundedPipeline.run(List.of("a", "b", "c"), 2));
        assertEquals("message", QueueSemanticsLab.handOff("message"));
        assertEquals(2, CompoundActionLab.reproduceDuplicateLoad().loadCount());
    }
}
