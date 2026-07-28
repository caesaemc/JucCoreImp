package com.caesaemc.juc.lesson10;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson10Test {

    @Test
    void futureShouldExposeStoredFailure() throws InterruptedException {
        FutureFailureDemo.FailureResult result = FutureFailureDemo.captureFailure();

        assertEquals("IllegalArgumentException", result.causeType());
        assertEquals(Future.State.FAILED, result.state());
    }

    @Test
    @Timeout(5)
    void deadlineShouldReturnSuccessAndRequestCancellationOnTimeout() throws Exception {
        try (var executor = Executors.newSingleThreadExecutor()) {
            DeadlineTaskRunner runner = new DeadlineTaskRunner(executor);
            assertEquals("ok", runner.call(() -> "ok", Duration.ofSeconds(1)).value());

            DeadlineTaskRunner.TaskResult<String> timeout = runner.call(() -> {
                Thread.sleep(2_000);
                return "late";
            }, Duration.ofMillis(20));
            assertTrue(timeout.timedOut());
            assertTrue(timeout.cancellationRequested());
        }
    }

    @Test
    @Timeout(5)
    void gracefulShutdownShouldTerminateExecutor() {
        var executor = Executors.newFixedThreadPool(2);
        executor.submit(() -> {
        });

        GracefulExecutor.ShutdownResult result =
                GracefulExecutor.shutdownAndAwait(executor, Duration.ofSeconds(1));

        assertTrue(result.terminated());
    }
}
