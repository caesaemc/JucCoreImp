package com.caesaemc.juc.lesson02;

/**
 * 练习：保证多个线程获得不重复、连续的序号，且不能使用原子类。
 */
public final class SequenceExercise {

    // volatile 能让新值可见，但不能保护“读取、加一、写回”这一整段。
    private volatile int sequence;

    public int next() {
        // TODO：多个线程可能读到同一个旧值，请让整个 ++ 一次只由一个线程执行。
        return ++sequence;
    }

    public int current() {
        // 思考：它应该和 next() 使用哪一把锁，才能可靠看到已完成的更新？
        return sequence;
    }
}
