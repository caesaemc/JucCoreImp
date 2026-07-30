package com.caesaemc.juc.course01;

/**
 * 第一课的最小共享变量：字段在堆对象中，多个线程共同读写它。
 */
public final class SharedCounterLab {

    private SharedCounterLab() {
    }

    public static final class UnsafeCounter {
        private int value;

        public void increment() {
            // 这一行会被拆成“读取、加一、写回”，并不是一个原子动作。
            value++;
        }

        public int value() {
            return value;
        }
    }

    public static final class LockedCounter {
        private int value;

        public synchronized void increment() {
            value++;
        }

        public synchronized int value() {
            return value;
        }
    }
}
