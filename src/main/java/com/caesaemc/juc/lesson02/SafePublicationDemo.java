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
        // 所有线程只通过 current 取得配置。
        // volatile 让“换新配置”和“读取新配置”建立可靠的交接。
        private volatile Settings current;

        public ConfigRepository(Settings initial) {
            this.current = initial;
        }

        public Settings snapshot() {
            // 只读一次引用，后面一直使用同一个 Settings 版本。
            return current;
        }

        public void update(Settings settings) {
            // settings 在传进来之前已经完整构造。
            // 这里只替换一次引用，不会逐个修改配置字段。
            current = settings;
        }
    }

    // record 的字段都是 final；对象建好以后不再修改。
    public record Settings(int version, int timeoutMillis, int retries, int checksum) {

        public static Settings of(int version, int timeoutMillis, int retries) {
            // 先把同一版本的所有字段放进一个新对象。
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
