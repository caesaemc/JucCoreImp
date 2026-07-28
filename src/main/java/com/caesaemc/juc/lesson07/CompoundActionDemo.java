package com.caesaemc.juc.lesson07;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * ConcurrentHashMap 的单个方法安全，不会自动使 containsKey + put 成为原子操作。
 */
public final class CompoundActionDemo {

    private CompoundActionDemo() {
    }

    public static Result brokenCheckThenAct() throws InterruptedException {
        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
        CountDownLatch bothChecked = new CountDownLatch(2);
        CountDownLatch allowPut = new CountDownLatch(1);
        AtomicInteger creators = new AtomicInteger();

        Runnable task = () -> {
            if (!map.containsKey("key")) {
                creators.incrementAndGet();
                bothChecked.countDown();
                try {
                    allowPut.await();
                    map.put("key", Thread.currentThread().getName());
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                }
            }
        };

        Thread first = Thread.ofPlatform().name("creator-1").start(task);
        Thread second = Thread.ofPlatform().name("creator-2").start(task);
        bothChecked.await();
        allowPut.countDown();
        first.join();
        second.join();
        return new Result(creators.get(), map.size());
    }

    public static Result atomicCompute() throws InterruptedException {
        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
        AtomicInteger creators = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);

        Runnable task = () -> {
            try {
                start.await();
                map.computeIfAbsent("key", key -> {
                    creators.incrementAndGet();
                    return Thread.currentThread().getName();
                });
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        };

        Thread first = Thread.ofPlatform().name("compute-1").start(task);
        Thread second = Thread.ofPlatform().name("compute-2").start(task);
        start.countDown();
        first.join();
        second.join();
        return new Result(creators.get(), map.size());
    }

    public record Result(int creationCount, int mapSize) {
    }
}
