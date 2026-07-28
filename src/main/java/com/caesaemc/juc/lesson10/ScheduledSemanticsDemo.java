package com.caesaemc.juc.lesson10;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 记录周期任务的开始时间，帮助观察固定频率和固定延迟的区别。
 */
public final class ScheduledSemanticsDemo {

    private ScheduledSemanticsDemo() {
    }

    public static List<Long> recordFixedDelayStarts(
            ScheduledExecutorService scheduler,
            int executions,
            Duration workTime,
            Duration delay
    ) throws InterruptedException {
        List<Long> starts = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch done = new CountDownLatch(executions);
        var handle = scheduler.scheduleWithFixedDelay(() -> {
            starts.add(System.nanoTime());
            try {
                Thread.sleep(workTime);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            } finally {
                done.countDown();
            }
        }, 0, delay.toNanos(), TimeUnit.NANOSECONDS);

        done.await(5, TimeUnit.SECONDS);
        handle.cancel(true);
        return List.copyOf(starts);
    }
}
