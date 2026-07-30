package com.caesaemc.juc.course01;

/**
 * 第一课练习参考实现：不用原子类，使用同一把监视器保护读写。
 */
public final class Course01Exercise {

    private int value;

    public synchronized void increment() {
        value++;
    }

    public synchronized int value() {
        return value;
    }
}
