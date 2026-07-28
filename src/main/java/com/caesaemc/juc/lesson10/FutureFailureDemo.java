package com.caesaemc.juc.lesson10;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * submit 把异常保存在 Future 中，调用 get 时通过 ExecutionException 传播。
 */
public final class FutureFailureDemo {

    private FutureFailureDemo() {
    }

    public static FailureResult captureFailure() throws InterruptedException {
        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            Future<Integer> future = executor.submit(() -> {
                throw new IllegalArgumentException("invalid task");
            });
            try {
                future.get();
                throw new AssertionError("任务应当失败");
            } catch (ExecutionException exception) {
                return new FailureResult(
                        exception.getCause().getClass().getSimpleName(),
                        exception.getCause().getMessage(),
                        future.state()
                );
            }
        }
    }

    public record FailureResult(
            String causeType,
            String message,
            Future.State state
    ) {
    }
}
