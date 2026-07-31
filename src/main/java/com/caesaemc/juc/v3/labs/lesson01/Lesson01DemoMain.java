package com.caesaemc.juc.v3.labs.lesson01;

import java.time.Duration;

/** {@code DEMO}：第 01 课两个反例实验的统一运行入口。 */
public final class Lesson01DemoMain {

    private Lesson01DemoMain() {
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== 实验一：确定性丢失更新 ===");
        LostUpdateDemo.Result lostUpdate = LostUpdateDemo.runOnce();
        System.out.printf("期望=%d, 实际=%d, 丢失=%d%n%n",
                lostUpdate.expectedCompletedTasks(),
                lostUpdate.actualCompletedTasks(),
                lostUpdate.lostUpdates());

        System.out.println("=== 实验二：真实死锁与 JVM 检测 ===");
        DeadlockDemo.DeadlockReport deadlock = DeadlockDemo.createAndDetect(Duration.ofSeconds(2));
        deadlock.lessonWorkers().forEach(worker -> System.out.printf(
                "%s 等待 %s（锁持有者：%s）%n",
                worker.threadName(), worker.waitingForLock(), worker.lockOwnerName()));
    }
}
