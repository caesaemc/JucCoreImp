package com.caesaemc.juc.lesson14;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public final class Lesson14Application {

    private Lesson14Application() {
    }

    public static void main(String[] args) throws Exception {
        Memoizer<String, String> memoizer = new Memoizer<>();
        AtomicInteger loads = new AtomicInteger();
        System.out.println("缓存结果：" + memoizer.compute(
                "profile:42",
                () -> "value-" + loads.incrementAndGet()
        ));
        System.out.println("再次读取：" + memoizer.compute(
                "profile:42",
                () -> "不应执行"
        ));

        BoundedAggregator aggregator = new BoundedAggregator(2);
        List<BoundedAggregator.NamedTask<String>> tasks = List.of(
                new BoundedAggregator.NamedTask<>("inventory", () -> "有货"),
                new BoundedAggregator.NamedTask<>("price", () -> "99.00"),
                new BoundedAggregator.NamedTask<>("recommendation", () -> {
                    Thread.sleep(200);
                    return "猜你喜欢";
                })
        );
        System.out.println("聚合结果："
                + aggregator.aggregate(tasks, Duration.ofMillis(80)));
        System.out.println("观测到的最大资源并发："
                + aggregator.maxObservedConcurrency());
    }
}
