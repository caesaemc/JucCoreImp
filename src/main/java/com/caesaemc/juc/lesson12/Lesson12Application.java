package com.caesaemc.juc.lesson12;

import java.time.Duration;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.IntStream;

public final class Lesson12Application {

    private Lesson12Application() {
    }

    public static void main(String[] args) throws Exception {
        int[] values = IntStream.rangeClosed(1, 100_000).toArray();
        try (ForkJoinPool pool = new ForkJoinPool()) {
            System.out.println("ForkJoin 求和：" + pool.invoke(new ParallelSumTask(values)));
        }
        System.out.println("ManagedBlocker：" + ManagedBlockerDemo.managedSleep(Duration.ofMillis(10)));
        System.out.println("任务选型：" + TaskModelSelector.select(
                new TaskModelSelector.TaskShape(true, false, false, 100)
        ));
    }
}
