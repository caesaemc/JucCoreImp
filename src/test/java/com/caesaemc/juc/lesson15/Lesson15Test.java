package com.caesaemc.juc.lesson15;

import com.caesaemc.juc.lesson09.InstrumentedThreadPool;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson15Test {

    @Test
    @Timeout(5)
    void harnessShouldRunEveryActorAndCollectInInputOrder() throws Exception {
        AtomicInteger calls = new AtomicInteger();

        List<Integer> results = ConcurrentTestHarness.runTogether(
                List.of(
                        () -> {
                            calls.incrementAndGet();
                            return 1;
                        },
                        () -> {
                            calls.incrementAndGet();
                            return 2;
                        },
                        () -> {
                            calls.incrementAndGet();
                            return 3;
                        }
                ),
                Duration.ofSeconds(1)
        );

        assertEquals(List.of(1, 2, 3), results);
        assertEquals(3, calls.get());
    }

    @Test
    @Timeout(5)
    void backlogLabShouldExposeActiveAndQueuedWork() throws Exception {
        InstrumentedThreadPool.MetricsSnapshot snapshot =
                QueueBacklogLab.capture(2, 4);

        assertEquals(2, snapshot.active());
        assertEquals(4, snapshot.queued());
        assertEquals(2, snapshot.started());
        assertEquals(0, snapshot.rejected());
    }

    @Test
    @Timeout(10)
    void jfrDemoShouldWriteReadableNonEmptyRecording() throws Exception {
        Path recording = Files.createTempFile("juc-lesson15-", ".jfr");
        try {
            JfrRecordingDemo.record(recording);
            assertTrue(Files.size(recording) > 0);
        } finally {
            Files.deleteIfExists(recording);
        }
    }

    @Test
    void commandGuideShouldUseTargetPid() {
        assertTrue(DiagnosticCommandGuide.forPid(42)
                .stream()
                .allMatch(command -> command.contains("42")));
    }
}
