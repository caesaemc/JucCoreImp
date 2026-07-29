package com.caesaemc.juc.lesson02;

/**
 * 正确的双重检查锁单例。
 */
public final class DclSingleton {

    // 这是其他线程取得单例的共享入口，必须安全发布。
    private static volatile DclSingleton instance;

    private final long createdAtNanos;

    private DclSingleton() {
        createdAtNanos = System.nanoTime();
    }

    public static DclSingleton instance() {
        // 先复制到局部变量，后面少读几次 volatile。
        DclSingleton local = instance;
        // 已经创建过时直接返回，不必每次都加锁。
        if (local == null) {
            synchronized (DclSingleton.class) {
                // 等锁期间，另一个线程可能已经创建完成，所以要再检查一次。
                local = instance;
                if (local == null) {
                    // 先把对象完整创建好。
                    local = new DclSingleton();
                    // 再通过 volatile 引用交给其他线程。
                    instance = local;
                }
            }
        }
        return local;
    }

    public long createdAtNanos() {
        return createdAtNanos;
    }
}
