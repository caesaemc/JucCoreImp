package com.caesaemc.juc.course05;

import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * TimeoutException 只表示调用方不再等待；cancel(true) 再把中断请求发给任务。
 */
public final class DeadlineRunner {

    private DeadlineRunner() {
    }

    public static <T> Result<T> run(Callable<T> task, Duration timeout)
            throws InterruptedException {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var future = executor.submit(task);
            try {
                return Result.success(future.get(timeout.toNanos(), TimeUnit.NANOSECONDS));
            } catch (TimeoutException exception) {
                future.cancel(true);
                return Result.timeout();
            } catch (ExecutionException exception) {
                return Result.failed(exception.getCause());
            }
        }
    }

    public record Result<T>(Status status, T value, Throwable failure) {
        public static <T> Result<T> success(T value) {
            return new Result<>(Status.SUCCESS, value, null);
        }

        public static <T> Result<T> timeout() {
            return new Result<>(Status.TIMEOUT, null, null);
        }

        public static <T> Result<T> failed(Throwable failure) {
            return new Result<>(Status.FAILED, null, failure);
        }
    }

    public enum Status {
        SUCCESS,
        TIMEOUT,
        FAILED
    }
}
