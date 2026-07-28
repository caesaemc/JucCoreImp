package com.caesaemc.juc.lesson02;

import com.caesaemc.juc.lesson01.Counter;
import com.caesaemc.juc.lesson01.CounterRaceDemo;

/**
 * volatile 可以提供可见性和顺序保证，但不能把复合的 value++ 变成原子操作。
 */
public final class VolatileCounterDemo {

    private VolatileCounterDemo() {
    }

    public static void main(String[] args) throws InterruptedException {
        for (int trial = 1; trial <= 5; trial++) {
            CounterRaceDemo.CounterResult result =
                    CounterRaceDemo.runTrial(new VolatileCounter(), 4, 100_000);
            System.out.printf(
                    "第 %d 轮：期望=%d，实际=%d，丢失=%d%n",
                    trial,
                    result.expected(),
                    result.actual(),
                    result.lostUpdates()
            );
        }
    }

    public static final class VolatileCounter implements Counter {
        private volatile int value;

        @Override
        public void increment() {
            value++;
        }

        @Override
        public int value() {
            return value;
        }
    }
}
