package com.caesaemc.juc.lesson07;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CacheExerciseTest {

    @Test
    @Disabled("完成 CacheExercise 后启用")
    void shouldLoadOneValueUnderContention() {
        CacheExercise cache = new CacheExercise();

        IntStream.range(0, 10_000).parallel().forEach(index -> cache.get("same"));

        assertEquals(1, cache.loadCount());
    }
}
