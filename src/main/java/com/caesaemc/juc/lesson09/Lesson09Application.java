package com.caesaemc.juc.lesson09;

public final class Lesson09Application {

    private Lesson09Application() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("execute 决策：" + ThreadPoolDecisionModel.decide(true, 1, 1, 2, false));
        System.out.println("饱和实验：" + PoolSaturationDemo.run());
    }
}
