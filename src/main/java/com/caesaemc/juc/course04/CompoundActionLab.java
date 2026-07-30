package com.caesaemc.juc.course04;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * containsKey 和 put 各自安全，不代表它们组成的 check-then-act 是原子的。
 */
public final class CompoundActionLab {

    private CompoundActionLab() {
    }

    public static Result reproduceDuplicateLoad() throws InterruptedException {
        Map<String, String> cache = new ConcurrentHashMap<>();
        AtomicInteger loads = new AtomicInteger();
        CountDownLatch bothMissed = new CountDownLatch(2);
        CountDownLatch allowLoad = new CountDownLatch(1);

        Runnable brokenLoad = () -> {
            if (!cache.containsKey("profile")) {
                bothMissed.countDown();
                await(allowLoad);
                cache.put("profile", "value-" + loads.incrementAndGet());
            }
        };

        Thread first = new Thread(brokenLoad, "course04-loader-a");
        Thread second = new Thread(brokenLoad, "course04-loader-b");
        first.start();
        second.start();
        bothMissed.await();
        allowLoad.countDown();
        first.join();
        second.join();
        return new Result(loads.get(), cache.get("profile"));
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("等待时被中断", exception);
        }
    }

    public record Result(int loadCount, String finalValue) {
    }
}
