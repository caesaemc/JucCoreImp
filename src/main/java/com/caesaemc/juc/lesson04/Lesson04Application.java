package com.caesaemc.juc.lesson04;

import com.caesaemc.juc.lesson01.CounterRaceDemo;

public final class Lesson04Application {

    private Lesson04Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        CounterRaceDemo.CounterResult counter =
                CounterRaceDemo.runTrial(new VarHandleCounter(), 8, 50_000);
        System.out.println("VarHandle CAS 计数：" + counter);

        System.out.println("ABA 实验：" + AbaDemo.demonstrate());
        System.out.println("AtomicLong/LongAdder 完成值：" + AdderComparisonDemo.run(8, 50_000));
    }
}
