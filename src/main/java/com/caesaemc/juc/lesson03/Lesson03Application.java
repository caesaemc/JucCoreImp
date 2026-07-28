package com.caesaemc.juc.lesson03;

import java.time.Duration;

public final class Lesson03Application {

    private Lesson03Application() {
    }

    public static void main(String[] args) throws Exception {
        ThreadLifecycleDemo.StateTrace trace = ThreadLifecycleDemo.trace();
        System.out.println("线程状态轨迹：" + trace);

        TwoPhaseTerminator terminator = new TwoPhaseTerminator();
        terminator.start();
        terminator.awaitRunning(Duration.ofSeconds(1));
        Thread.sleep(80);
        terminator.close();
        System.out.printf("执行轮次=%d，是否完成清理=%s%n", terminator.cycles(), terminator.isStopped());

        String value = ThreadLocalScope.callWithRequestId(
                "request-001",
                ThreadLocalScope::currentRequestId
        );
        System.out.printf("作用域内=%s，作用域外=%s%n", value, ThreadLocalScope.currentRequestId());

        GuardedMailbox<String> mailbox = new GuardedMailbox<>();
        Thread.ofPlatform().start(() -> mailbox.complete("result"));
        System.out.println("保护性暂停结果：" + mailbox.await(Duration.ofSeconds(1)));
    }
}
