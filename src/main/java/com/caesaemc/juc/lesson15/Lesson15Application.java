package com.caesaemc.juc.lesson15;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

public final class Lesson15Application {

    private Lesson15Application() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("同时开始的 actor 结果：" + ConcurrentTestHarness.runTogether(
                List.of(() -> Thread.currentThread().getName(),
                        () -> Thread.currentThread().getName()),
                Duration.ofSeconds(1)
        ));
        System.out.println("堆积快照：" + QueueBacklogLab.capture(2, 5));

        Path recording = JfrRecordingDemo.record(Path.of("target", "lesson15-demo.jfr"));
        System.out.println("JFR 已生成：" + recording);
        System.out.println("故障实验：DiagnosticFaultLab deadlock|spin|backlog|contention 60");
    }
}
