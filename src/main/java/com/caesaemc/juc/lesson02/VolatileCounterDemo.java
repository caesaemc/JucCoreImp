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
        // volatile 只保证：一个线程写入后，其他线程能看到新值。
        // 它不会把下面的 value++ 变成一个不可拆分的动作。
        private volatile int value;

        @Override
        public void increment() {
            // 实际过程是：读 value → 加 1 → 写回。
            // 两个线程可能读到同一个旧值，最后写回同一个新值。
            value++;
        }

        @Override
        public int value() {
            // 这里能看到较新的值，但之前丢掉的更新不会被补回来。
            return value;
        }
    }
}
