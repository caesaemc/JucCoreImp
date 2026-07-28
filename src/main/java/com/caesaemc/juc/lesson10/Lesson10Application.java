package com.caesaemc.juc.lesson10;

import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class Lesson10Application {

    private Lesson10Application() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Future 异常：" + FutureFailureDemo.captureFailure());

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            DeadlineTaskRunner runner = new DeadlineTaskRunner(executor);
            System.out.println("成功：" + runner.call(() -> "ok", Duration.ofSeconds(1)));
            System.out.println("超时：" + runner.call(() -> {
                Thread.sleep(1_000);
                return "late";
            }, Duration.ofMillis(20)));
        }
    }
}
