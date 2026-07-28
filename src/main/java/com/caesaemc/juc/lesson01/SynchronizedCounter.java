package com.caesaemc.juc.lesson01;

/**
 * 使用同一对象监视器保护读写操作的计数器。
 *
 * <p>本课只用它作为正确实现的对照组，synchronized 的完整语义将在第二课展开。</p>
 */
public final class SynchronizedCounter implements Counter {

    private int value;

    @Override
    public synchronized void increment() {
        value++;
    }

    @Override
    public synchronized int value() {
        return value;
    }
}
