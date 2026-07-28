package com.caesaemc.juc.lesson01;

/**
 * 第一课所有安全实验的统一入口。
 */
public final class Lesson01Application {

    private Lesson01Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== 实验 1：确定性复现丢失更新 ===");
        DeterministicLostUpdateDemo.LostUpdateResult lostUpdate =
                DeterministicLostUpdateDemo.runOnce();
        System.out.printf(
                "期望=%d，实际=%d%n",
                lostUpdate.expected(),
                lostUpdate.actual()
        );

        System.out.println("\n=== 实验 2：并发计数统计 ===");
        CounterRaceDemo.main(args);

        System.out.println("\n=== 实验 3：start/join 的 happens-before ===");
        HappensBeforeDemo.HappensBeforeResult happensBefore =
                HappensBeforeDemo.demonstrate();
        System.out.printf(
                "工作线程读取=%d，join 后主线程读取=%d%n",
                happensBefore.observedByWorker(),
                happensBefore.outputAfterJoin()
        );

        System.out.println("\n可见性错误实验请单独运行 VisibilityDemo plain/volatile。");
    }
}
