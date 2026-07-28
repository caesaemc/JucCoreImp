package com.caesaemc.juc.lesson12;

import java.time.Duration;
import java.util.concurrent.ForkJoinPool;

/**
 * 告知 ForkJoinPool 当前 worker 即将阻塞。
 */
public final class ManagedBlockerDemo {

    private ManagedBlockerDemo() {
    }

    public static boolean managedSleep(Duration duration) throws InterruptedException {
        SleepBlocker blocker = new SleepBlocker(duration);
        ForkJoinPool.managedBlock(blocker);
        return blocker.isReleasable();
    }

    private static final class SleepBlocker implements ForkJoinPool.ManagedBlocker {
        private final long deadlineNanos;
        private boolean done;

        private SleepBlocker(Duration duration) {
            deadlineNanos = System.nanoTime() + duration.toNanos();
        }

        @Override
        public boolean block() throws InterruptedException {
            while (!isReleasable()) {
                long remaining = deadlineNanos - System.nanoTime();
                if (remaining > 0) {
                    Thread.sleep(Duration.ofNanos(remaining));
                }
            }
            done = true;
            return true;
        }

        @Override
        public boolean isReleasable() {
            if (!done && System.nanoTime() >= deadlineNanos) {
                done = true;
            }
            return done;
        }
    }
}
