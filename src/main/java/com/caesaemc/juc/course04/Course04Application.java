package com.caesaemc.juc.course04;

import java.util.List;

public final class Course04Application {

    private Course04Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        CompoundActionLab.Result race = CompoundActionLab.reproduceDuplicateLoad();
        List<String> output = BoundedPipeline.run(List.of("a", "b", "c"), 2);

        System.out.printf("破损复合操作加载 %d 次，最终值=%s%n",
                race.loadCount(), race.finalValue());
        System.out.printf("有界流水线输出=%s，直接移交=%s%n",
                output, QueueSemanticsLab.handOff("handoff"));
    }
}
