package com.caesaemc.juc.lesson02;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 使用不可变对象和 volatile 引用发布一致的配置快照。
 */
public final class SafePublicationDemo {

    private SafePublicationDemo() {
    }

    public static ConsistencyResult verify(int updates, int reads)
            throws InterruptedException {
        ConfigRepository repository = new ConfigRepository(Settings.of(0, 100, 1));
        CountDownLatch start = new CountDownLatch(1);
        AtomicReference<Settings> invalidSnapshot = new AtomicReference<>();

        Thread writer = new Thread(() -> {
            await(start);
            for (int version = 1; version <= updates; version++) {
                repository.update(Settings.of(version, version * 10, version % 5));
            }
        }, "config-writer");

        Thread reader = new Thread(() -> {
            await(start);
            for (int index = 0; index < reads; index++) {
                Settings settings = repository.snapshot();
                if (!settings.isConsistent()) {
                    invalidSnapshot.compareAndSet(null, settings);
                    return;
                }
            }
        }, "config-reader");

        writer.start();
        reader.start();
        start.countDown();
        writer.join();
        reader.join();
        return new ConsistencyResult(invalidSnapshot.get() == null, repository.snapshot());
    }

    public static void main(String[] args) throws InterruptedException {
        ConsistencyResult result = verify(20_000, 100_000);
        System.out.printf(
                "是否始终观察到一致快照=%s，最终版本=%d%n",
                result.consistent(),
                result.finalSettings().version()
        );
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("启动闸门超时");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("线程在等待启动时被中断", exception);
        }
    }

    public static final class ConfigRepository {
        private volatile Settings current;

        public ConfigRepository(Settings initial) {
            this.current = initial;
        }

        public Settings snapshot() {
            return current;
        }

        public void update(Settings settings) {
            current = settings;
        }
    }

    public record Settings(int version, int timeoutMillis, int retries, int checksum) {

        public static Settings of(int version, int timeoutMillis, int retries) {
            return new Settings(version, timeoutMillis, retries, checksum(version, timeoutMillis, retries));
        }

        public boolean isConsistent() {
            return checksum == checksum(version, timeoutMillis, retries);
        }

        private static int checksum(int version, int timeoutMillis, int retries) {
            return 31 * (31 * version + timeoutMillis) + retries;
        }
    }

    public record ConsistencyResult(boolean consistent, Settings finalSettings) {
    }
}
