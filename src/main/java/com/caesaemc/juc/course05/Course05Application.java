package com.caesaemc.juc.course05;

import java.time.Duration;

public final class Course05Application {

    private Course05Application() {
    }

    public static void main(String[] args) throws Exception {
        ThreadPoolDecisionLab.Snapshot pool = ThreadPoolDecisionLab.observe();
        DeadlineRunner.Result<String> timeout = DeadlineRunner.run(() -> {
            Thread.sleep(100);
            return "late";
        }, Duration.ofMillis(10));
        VirtualThreadLab.Result virtual = VirtualThreadLab.run(8, 2, Duration.ofMillis(5));

        System.out.printf("线程池：workers=%d, queue=%d, rejected=%s%n",
                pool.poolSize(), pool.queuedTasks(), pool.rejected());
        System.out.printf("超时状态=%s，虚拟线程资源峰值=%d%n",
                timeout.status(), virtual.maxObservedConcurrency());
    }
}
