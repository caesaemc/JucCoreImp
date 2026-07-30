package com.caesaemc.juc.course02;

/**
 * 正确的双重检查锁：锁内防止重复创建，volatile 负责发布完整对象。
 */
public final class DclSingleton {

    private static volatile DclSingleton instance;

    private final long createdAtNanos;

    private DclSingleton() {
        createdAtNanos = System.nanoTime();
    }

    public static DclSingleton instance() {
        DclSingleton local = instance;
        if (local == null) {
            synchronized (DclSingleton.class) {
                local = instance;
                if (local == null) {
                    local = new DclSingleton();
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
