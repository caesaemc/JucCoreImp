package com.caesaemc.juc.course03;

import java.time.Duration;

public final class Course03Application {

    private Course03Application() {
    }

    public static void main(String[] args) throws Exception {
        CasCounter counter = new CasCounter();
        counter.increment();
        counter.increment();

        try (TwoPhaseTerminator terminator = new TwoPhaseTerminator()) {
            terminator.start();
            terminator.awaitRunning(Duration.ofSeconds(1));
        }

        ResourceGate gate = new ResourceGate(2);
        String value = gate.call(() -> "resource-ok");
        System.out.printf("CAS=%d，资源调用=%s，最大并发=%d%n",
                counter.value(), value, gate.maxObservedConcurrency());
    }
}
