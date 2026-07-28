package com.caesaemc.juc.lesson03;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 练习：修复吞掉中断的问题，并提供可验证的停止协议。
 */
public final class CancellationExercise implements Runnable {

    private final AtomicInteger completedUnits = new AtomicInteger();

    @Override
    public void run() {
        while (true) {
            try {
                TimeUnit.MILLISECONDS.sleep(20);
                completedUnits.incrementAndGet();
            } catch (InterruptedException ignored) {
                // TODO：不能吞掉中断。恢复中断状态并退出循环。
            }
        }
    }

    public int completedUnits() {
        return completedUnits.get();
    }
}
