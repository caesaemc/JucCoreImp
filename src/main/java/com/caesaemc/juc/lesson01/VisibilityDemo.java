package com.caesaemc.juc.lesson01;

import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * 对比普通字段和 volatile 字段的停止标志。
 *
 * <p>普通字段版本是否在本次运行中停止不是固定的。即使它停止了，也不能证明代码正确。</p>
 */
public final class VisibilityDemo {

    private static final long WARM_UP_MILLIS = 100;
    private static final long DEFAULT_TIMEOUT_MILLIS = 500;

    private VisibilityDemo() {
    }

    public static Observation observePlain(long timeoutMillis) throws InterruptedException {
        PlainFlagTask task = new PlainFlagTask();
        Thread worker = daemonThread(task, "plain-flag-worker");
        worker.start();
        awaitStarted(task.started);

        // sleep 没有内存同步语义；这里只是给工作线程一些运行时间。
        Thread.sleep(WARM_UP_MILLIS);
        task.stop();
        worker.join(timeoutMillis);

        return new Observation(
                "plain",
                !worker.isAlive(),
                "普通字段存在数据竞争；一次运行停止或未停止都不能改变这个结论"
        );
    }

    public static Observation observeVolatile(long timeoutMillis) throws InterruptedException {
        VolatileFlagTask task = new VolatileFlagTask();
        Thread worker = daemonThread(task, "volatile-flag-worker");
        worker.start();
        awaitStarted(task.started);

        Thread.sleep(WARM_UP_MILLIS);
        task.stop();
        worker.join(timeoutMillis);

        return new Observation(
                "volatile",
                !worker.isAlive(),
                "volatile 写 happens-before 后续对同一字段的 volatile 读"
        );
    }

    public static void main(String[] args) throws InterruptedException {
        String variant = args.length == 0 ? "plain" : args[0].toLowerCase(Locale.ROOT);
        Observation observation = switch (variant) {
            case "plain" -> observePlain(DEFAULT_TIMEOUT_MILLIS);
            case "volatile" -> observeVolatile(DEFAULT_TIMEOUT_MILLIS);
            default -> throw new IllegalArgumentException("参数只能是 plain 或 volatile");
        };

        System.out.printf(
                "模式=%s，工作线程是否在超时前停止=%s%n说明：%s%n",
                observation.variant(),
                observation.stoppedWithinTimeout(),
                observation.explanation()
        );
    }

    private static Thread daemonThread(Runnable task, String name) {
        Thread thread = new Thread(task, name);
        // 错误示例可能不结束，设置为 daemon 防止教学程序永久挂住 JVM。
        thread.setDaemon(true);
        return thread;
    }

    private static void awaitStarted(CountDownLatch started) throws InterruptedException {
        if (!started.await(5, TimeUnit.SECONDS)) {
            throw new IllegalStateException("工作线程未能及时启动");
        }
    }

    private static final class PlainFlagTask implements Runnable {
        private final CountDownLatch started = new CountDownLatch(1);
        private boolean running = true;

        @Override
        public void run() {
            started.countDown();
            while (running) {
                // 故意留空。编译器没有义务重复读取没有正确同步的 running。
            }
        }

        private void stop() {
            running = false;
        }
    }

    private static final class VolatileFlagTask implements Runnable {
        private final CountDownLatch started = new CountDownLatch(1);
        private volatile boolean running = true;

        @Override
        public void run() {
            started.countDown();
            while (running) {
                // 每次条件判断都是 volatile 读。
            }
        }

        private void stop() {
            running = false;
        }
    }

    public record Observation(
            String variant,
            boolean stoppedWithinTimeout,
            String explanation
    ) {
    }
}
