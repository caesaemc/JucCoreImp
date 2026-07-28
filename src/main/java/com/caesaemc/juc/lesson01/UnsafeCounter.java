package com.caesaemc.juc.lesson01;

/**
 * 故意不提供任何同步措施的计数器。
 *
 * <p>它在单线程中行为正确，但多个线程同时执行 {@link #increment()} 时会发生数据竞争。</p>
 */
public final class UnsafeCounter implements Counter {

    private int value;

    @Override
    public void increment() {
        value++;
    }

    @Override
    public int value() {
        return value;
    }
}
