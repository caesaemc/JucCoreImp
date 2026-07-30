package com.caesaemc.juc.course01;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class Course01ExerciseTest {

    @Test
    void reproducesLostUpdateAndProvesStartJoin() throws InterruptedException {
        assertEquals(1, LostUpdateLab.reproduce());
        assertEquals(new HappensBeforeLab.Result(42, 84), HappensBeforeLab.run());
    }

    @Test
    void keepsEveryIncrementWhenOneMonitorProtectsReadAndWrite()
            throws InterruptedException {
        Course01Exercise counter = new Course01Exercise();
        List<Thread> threads = new ArrayList<>();

        for (int index = 0; index < 4; index++) {
            Thread thread = new Thread(() -> {
                for (int count = 0; count < 10_000; count++) {
                    counter.increment();
                }
            });
            threads.add(thread);
            thread.start();
        }

        for (Thread thread : threads) {
            thread.join();
        }
        assertEquals(40_000, counter.value());
    }
}
