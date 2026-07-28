package com.caesaemc.juc.lesson01;

/**
 * 第一课练习。
 *
 * <p>请在不使用 AtomicInteger 的前提下，让这个类在多线程环境中安全计数。</p>
 */
public final class ExerciseCounter implements Counter {

    private int value;

    @Override
    public void increment() {
        // TODO 第一课练习：修复这里的丢失更新。
        value++;
    }

    @Override
    public int value() {
        // TODO 第一课练习：同时考虑读取的可见性。
        return value;
    }
}
