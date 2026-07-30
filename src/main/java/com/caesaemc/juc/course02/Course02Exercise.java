package com.caesaemc.juc.course02;

/**
 * 第二课练习参考实现：next 和 current 必须使用同一把锁。
 */
public final class Course02Exercise {

    private long sequence;

    public synchronized long next() {
        return ++sequence;
    }

    public synchronized long current() {
        return sequence;
    }
}
