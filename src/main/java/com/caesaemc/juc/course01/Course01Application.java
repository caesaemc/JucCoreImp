package com.caesaemc.juc.course01;

public final class Course01Application {

    private Course01Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        int lostUpdateResult = LostUpdateLab.reproduce();
        HappensBeforeLab.Result happensBefore = HappensBeforeLab.run();

        System.out.printf("丢失更新：期望 2，实际 %d%n", lostUpdateResult);
        System.out.printf(
                "start/join：worker 看到 %d，main 看到 %d%n",
                happensBefore.observedInput(),
                happensBefore.outputAfterJoin()
        );
    }
}
