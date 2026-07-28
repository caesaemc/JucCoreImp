package com.caesaemc.juc.lesson15;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DeterministicRaceExerciseTest {

    @Test
    @Disabled("完成 DeterministicRaceExercise 后启用")
    void shouldExposeLostUpdateOnEveryRun() throws Exception {
        for (int index = 0; index < 100; index++) {
            assertEquals(1, DeterministicRaceExercise.exposeLostUpdate());
        }
    }
}
