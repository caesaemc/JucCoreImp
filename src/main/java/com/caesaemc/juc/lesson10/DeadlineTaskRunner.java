package com.caesaemc.juc.lesson10;

import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Future 超时后主动发出取消请求。
 */
public final class DeadlineTaskRunner {

    private final ExecutorService executor;

    public DeadlineTaskRunner(ExecutorService executor) {
        this.executor = executor;
    }

    public <T> TaskResult<T> call(Callable<T> task, Duration timeout)
            throws InterruptedException {
        Future<T> future = executor.submit(task);
        try {
            return TaskResult.success(
                    future.get(timeout.toNanos(), TimeUnit.NANOSECONDS)
            );
        } catch (TimeoutException exception) {
            boolean cancellationRequested = future.cancel(true);
            return TaskResult.timedOut(cancellationRequested);
        } catch (ExecutionException exception) {
            return TaskResult.failure(exception.getCause());
        }
    }

    public record TaskResult<T>(
            T value,
            Throwable failure,
            boolean timedOut,
            boolean cancellationRequested
    ) {

        public static <T> TaskResult<T> success(T value) {
            return new TaskResult<>(value, null, false, false);
        }

        public static <T> TaskResult<T> failure(Throwable failure) {
            return new TaskResult<>(null, failure, false, false);
        }

        public static <T> TaskResult<T> timedOut(boolean cancellationRequested) {
            return new TaskResult<>(null, null, true, cancellationRequested);
        }
    }
}
