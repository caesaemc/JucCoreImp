package com.caesaemc.juc.lesson06;

import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;

/**
 * 练习：确保任何成功 acquire 都对应 finally 中的 release。
 */
public final class PermitGuardExercise {

    private final Semaphore semaphore;

    public PermitGuardExercise(int permits) {
        semaphore = new Semaphore(permits);
    }

    public <T> T call(Callable<T> action) throws Exception {
        semaphore.acquire();
        // TODO：使用 try/finally，异常时也必须归还许可。
        T value = action.call();
        semaphore.release();
        return value;
    }

    public int availablePermits() {
        return semaphore.availablePermits();
    }
}
