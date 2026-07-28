package com.caesaemc.juc.lesson02;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SequenceExerciseTest {

    @Test
    @Disabled("完成 SequenceExercise 后启用")
    void shouldGenerateUniqueSequenceValues() {
        SequenceExercise sequence = new SequenceExercise();
        Set<Integer> values = ConcurrentHashMap.newKeySet();

        IntStream.range(0, 100_000).parallel().forEach(index -> values.add(sequence.next()));

        assertEquals(100_000, values.size());
        assertEquals(100_000, sequence.current());
    }
}
