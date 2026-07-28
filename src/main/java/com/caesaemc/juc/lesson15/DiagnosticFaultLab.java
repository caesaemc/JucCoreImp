package com.caesaemc.juc.lesson15;

import com.caesaemc.juc.lesson06.DeadlockLab;
import com.caesaemc.juc.lesson09.InstrumentedThreadPool;

import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 手工诊断用故障进程。默认保留 60 秒观测窗口。
 */
public final class DiagnosticFaultLab {

    private DiagnosticFaultLab() {
    }

    public static void main(String[] args) throws Exception {
        String mode = args.length == 0
                ? "deadlock"
                : args[0].toLowerCase(Locale.ROOT);
        Duration duration = Duration.ofSeconds(
                args.length < 2 ? 60 : Long.parseLong(args[1])
        );

        long pid = ProcessHandle.current().pid();
        System.out.println("PID=" + pid + "，模式=" + mode);
        DiagnosticCommandGuide.forPid(pid).forEach(System.out::println);

        switch (mode) {
            case "deadlock" -> runDeadlock(duration);
            case "spin" -> runSpin(duration);
            case "backlog" -> runBacklog(duration);
            case "contention" -> runContention(duration);
            default -> throw new IllegalArgumentException(
                    "模式必须是 deadlock、spin、backlog 或 contention"
            );
        }
    }

    private static void runDeadlock(Duration duration) throws Exception {
        System.out.println(DeadlockLab.createAndDetect(Duration.ofSeconds(1)));
        Thread.sleep(duration);
    }

    private static void runSpin(Duration duration) throws InterruptedException {
        AtomicBoolean running = new AtomicBoolean(true);
        Thread spinner = Thread.ofPlatform().name("cpu-spin-lab").start(() -> {
            long value = 1L;
            while (running.get()) {
                value = value * 31 + 17;
            }
            System.out.println("spin checksum=" + value);
        });
        Thread.sleep(duration);
        running.set(false);
        spinner.join();
    }

    private static void runBacklog(Duration duration) throws Exception {
        InstrumentedThreadPool pool = new InstrumentedThreadPool(
                2,
                2,
                100,
                "backlog"
        );
        CountDownLatch release = new CountDownLatch(1);
        for (int index = 0; index < 2; index++) {
            pool.submit(() -> {
                release.await();
                return null;
            });
        }
        for (int index = 0; index < 80; index++) {
            pool.submit(() -> "queued");
        }
        try {
            long deadline = System.nanoTime() + duration.toNanos();
            while (System.nanoTime() < deadline) {
                System.out.println(pool.metrics());
                Thread.sleep(Math.min(1_000, duration.toMillis()));
            }
        } finally {
            release.countDown();
            pool.shutdownNow();
            pool.awaitTermination(2, TimeUnit.SECONDS);
        }
    }

    private static void runContention(Duration duration) throws InterruptedException {
        Object lock = new Object();
        CountDownLatch holderEntered = new CountDownLatch(1);
        Thread holder = daemonThread("lock-holder", () -> {
            synchronized (lock) {
                holderEntered.countDown();
                try {
                    Thread.sleep(duration);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        holder.start();
        holderEntered.await();

        for (int index = 0; index < 12; index++) {
            daemonThread("lock-waiter-" + index, () -> {
                synchronized (lock) {
                    // 只用于在线程 dump 中形成 BLOCKED 栈。
                }
            }).start();
        }
        holder.join();
    }

    private static Thread daemonThread(String name, Runnable task) {
        Thread thread = Thread.ofPlatform().name(name).unstarted(task);
        thread.setDaemon(true);
        return thread;
    }
}
