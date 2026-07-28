package com.caesaemc.juc.lesson13;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.Callable;

public final class Lesson13Application {

    private Lesson13Application() {
    }

    public static void main(String[] args) throws Exception {
        List<Callable<String>> calls = List.of(
                () -> "virtual=" + Thread.currentThread().isVirtual(),
                () -> "name=" + Thread.currentThread().getName(),
                () -> "result"
        );
        System.out.println(
                VirtualThreadAggregator.invokeAll(calls, Duration.ofSeconds(1))
        );

        LimitedVirtualThreadService limited = new LimitedVirtualThreadService(2);
        limited.invoke(calls);
        System.out.println("外部资源最大并发：" + limited.maxObservedConcurrency());
    }
}
