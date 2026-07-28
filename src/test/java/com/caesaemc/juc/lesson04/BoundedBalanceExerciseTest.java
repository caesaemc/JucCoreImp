package com.caesaemc.juc.lesson04;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BoundedBalanceExerciseTest {

    @Test
    @Disabled("完成 BoundedBalanceExercise 后启用")
    void shouldNeverOverdraw() {
        BoundedBalanceExercise account = new BoundedBalanceExercise(100);
        long successes = IntStream.range(0, 1_000)
                .parallel()
                .filter(index -> account.withdraw(1))
                .count();

        assertEquals(100, successes);
        assertEquals(0, account.balance());
    }
}
