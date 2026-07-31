package com.caesaemc.juc.v3.labs.lesson01;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeadlockDemoTest {

    @Test
    @Timeout(value = 3, unit = TimeUnit.SECONDS)
    void shouldCreateAndDetectARealTwoThreadMonitorDeadlock() throws InterruptedException {
        DeadlockDemo.DeadlockReport report = DeadlockDemo.createAndDetect(Duration.ofSeconds(2));

        assertTrue(report.detectedBothLessonWorkers());
        assertEquals(2, report.lessonWorkerIds().size());
        assertEquals(2, report.lessonWorkers().size());
        assertTrue(report.lessonWorkers().stream()
                .allMatch(worker -> worker.state() == Thread.State.BLOCKED));

        Set<Long> lockOwners = report.lessonWorkers().stream()
                .map(DeadlockDemo.ThreadSnapshot::lockOwnerId)
                .collect(Collectors.toSet());
        assertEquals(report.lessonWorkerIds(), lockOwners,
                "两条等待边的锁持有者应当正好构成这两个线程的环");
    }
}
