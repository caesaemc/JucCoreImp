package com.caesaemc.juc.lesson07;

import java.util.concurrent.atomic.AtomicInteger;

public final class Lesson07Application {

    private Lesson07Application() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("错误复合操作：" + CompoundActionDemo.brokenCheckThenAct());
        System.out.println("原子 compute：" + CompoundActionDemo.atomicCompute());

        AtomicInteger loads = new AtomicInteger();
        ConcurrentCache<String, String> cache =
                new ConcurrentCache<>(key -> "loaded-" + loads.incrementAndGet());
        System.out.println(cache.get("A"));
        System.out.println(cache.get("A"));
        System.out.println("加载次数：" + loads.get());
    }
}
