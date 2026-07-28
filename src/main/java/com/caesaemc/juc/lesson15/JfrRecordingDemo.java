package com.caesaemc.juc.lesson15;

import jdk.jfr.Recording;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;

/**
 * 用 JFR API 录制一个包含线程休眠和锁竞争的短实验。
 */
public final class JfrRecordingDemo {

    private JfrRecordingDemo() {
    }

    public static Path record(Path destination) throws Exception {
        Path absolute = destination.toAbsolutePath();
        Path parent = absolute.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        Files.deleteIfExists(absolute);

        try (Recording recording = new Recording()) {
            recording.setName("juc-lesson-15");
            recording.enable("jdk.ThreadSleep").withThreshold(Duration.ZERO);
            recording.enable("jdk.JavaMonitorEnter").withThreshold(Duration.ZERO);
            recording.enable("jdk.ThreadPark").withThreshold(Duration.ZERO);
            recording.start();

            runContentionWorkload();

            recording.stop();
            recording.dump(absolute);
        } catch (IOException exception) {
            throw new IOException("无法写入 JFR: " + absolute, exception);
        }
        return absolute;
    }

    private static void runContentionWorkload() throws Exception {
        Object lock = new Object();
        List<Callable<Integer>> actors = new ArrayList<>();
        for (int index = 0; index < 6; index++) {
            actors.add(() -> {
                int completed = 0;
                for (int round = 0; round < 8; round++) {
                    synchronized (lock) {
                        Thread.sleep(2);
                        completed++;
                    }
                }
                return completed;
            });
        }
        ConcurrentTestHarness.runTogether(actors, Duration.ofSeconds(3));
    }
}
