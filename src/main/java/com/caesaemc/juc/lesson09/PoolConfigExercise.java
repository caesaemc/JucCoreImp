package com.caesaemc.juc.lesson09;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 练习：改造成有界、命名、拒绝行为明确的 ThreadPoolExecutor。
 */
public final class PoolConfigExercise {

    private PoolConfigExercise() {
    }

    public static ExecutorService create() {
        // TODO：不要使用无界队列的便捷工厂。
        return Executors.newFixedThreadPool(4);
    }
}
