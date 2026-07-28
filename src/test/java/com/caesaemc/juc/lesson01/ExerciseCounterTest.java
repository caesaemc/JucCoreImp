package com.caesaemc.juc.lesson01;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ExerciseCounterTest {

    @Test
    @Timeout(10)
    @Disabled("完成 ExerciseCounter 后删除 @Disabled，再运行本测试")
    void exerciseCounterShouldKeepEveryUpdate() throws InterruptedException {
        CounterRaceDemo.CounterResult result =
                CounterRaceDemo.runTrial(new ExerciseCounter(), 8, 50_000);

        assertTrue(
                result.isCorrect(),
                () -> "发生丢失更新：期望=" + result.expected() + "，实际=" + result.actual()
        );
    }
}
