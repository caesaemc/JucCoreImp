package com.caesaemc.juc.lesson12;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ForkJoinPool;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MaxTaskExerciseTest {

    @Test
    @Disabled("完成 MaxTaskExercise 后启用")
    void shouldFindMaximum() {
        try (ForkJoinPool pool = new ForkJoinPool()) {
            assertEquals(99, pool.invoke(new MaxTaskExercise(new int[]{3, 99, 4, 18})));
        }
    }
}
