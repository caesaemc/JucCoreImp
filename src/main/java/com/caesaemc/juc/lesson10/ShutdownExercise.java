package com.caesaemc.juc.lesson10;

import java.time.Duration;
import java.util.concurrent.ExecutorService;

/**
 * 练习：实现 shutdown → await → shutdownNow → 恢复中断。
 */
public final class ShutdownExercise {

    private ShutdownExercise() {
    }

    public static boolean shutdown(ExecutorService executor, Duration timeout) {
        // TODO：实现有总超时意识的两阶段关闭。
        executor.shutdown();
        return executor.isTerminated();
    }
}
