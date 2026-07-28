package com.caesaemc.juc.lesson06;

import java.time.Duration;

public final class Lesson06Application {

    private Lesson06Application() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Latch 完成数：" + SynchronizerShowcase.startTogether(5));
        System.out.println("Barrier：" + SynchronizerShowcase.crossBarrier(4, 3));

        ResourceGate gate = new ResourceGate(2, true);
        gate.call(() -> "ok");
        System.out.println("资源闸门最大并发：" + gate.maxObservedConcurrency());

        StampedPoint point = new StampedPoint();
        point.move(3, 4);
        System.out.println("StampedLock 距离：" + point.distanceFromOrigin());

        System.out.println("死锁检测：" + DeadlockLab.createAndDetect(Duration.ofSeconds(1)));
    }
}
