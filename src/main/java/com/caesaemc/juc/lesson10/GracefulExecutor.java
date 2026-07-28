package com.caesaemc.juc.lesson10;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 先停止接收并等待排空，再中断剩余任务。
 */
public final class GracefulExecutor {

    private GracefulExecutor() {
    }

    public static ShutdownResult shutdownAndAwait(
            ExecutorService executor,
            Duration timeout
    ) {
        long timeoutNanos = timeout.toNanos();
        executor.shutdown();
        try {
            if (executor.awaitTermination(timeoutNanos, TimeUnit.NANOSECONDS)) {
                return new ShutdownResult(true, List.of(), false);
            }

            List<Runnable> neverStarted = executor.shutdownNow();
            boolean terminated = executor.awaitTermination(
                    timeoutNanos,
                    TimeUnit.NANOSECONDS
            );
            return new ShutdownResult(terminated, List.copyOf(neverStarted), true);
        } catch (InterruptedException exception) {
            List<Runnable> neverStarted = executor.shutdownNow();
            Thread.currentThread().interrupt();
            return new ShutdownResult(false, List.copyOf(neverStarted), true);
        }
    }

    public record ShutdownResult(
            boolean terminated,
            List<Runnable> neverStarted,
            boolean forced
    ) {
    }
}
