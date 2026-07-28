package com.caesaemc.juc.lesson01;

/**
 * 第一课使用的最小计数器抽象。
 */
public interface Counter {

    void increment();

    int value();
}
