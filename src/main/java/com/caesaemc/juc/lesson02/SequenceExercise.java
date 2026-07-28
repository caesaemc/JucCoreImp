package com.caesaemc.juc.lesson02;

/**
 * 练习：保证多个线程获得不重复、连续的序号，且不能使用原子类。
 */
public final class SequenceExercise {

    private volatile int sequence;

    public int next() {
        // TODO：volatile 不能保证 ++ 的原子性，请修复。
        return ++sequence;
    }

    public int current() {
        return sequence;
    }
}
