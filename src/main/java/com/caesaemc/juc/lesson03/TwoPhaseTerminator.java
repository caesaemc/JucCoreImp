package com.caesaemc.juc.lesson03;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 使用 interrupt 发出停止请求，并在 finally 中执行清理。
 */
public final class TwoPhaseTerminator implements AutoCloseable {

    private final AtomicBoolean started = new AtomicBoolean();
    private final AtomicInteger cycles = new AtomicInteger();
    private final CountDownLatch running = new CountDownLatch(1);
    private final CountDownLatch stopped = new CountDownLatch(1);
    private final Thread worker = new Thread(this::runLoop, "two-phase-worker");

    public void start() {
        if (!started.compareAndSet(false, true)) {
            throw new IllegalStateException("任务只能启动一次");
        }
        worker.start();
    }

    public boolean awaitRunning(Duration timeout) throws InterruptedException {
        return running.await(timeout.toMillis(), TimeUnit.MILLISECONDS);
    }

    public int cycles() {
        return cycles.get();
    }

    public boolean isStopped() {
        return stopped.getCount() == 0;
    }

    private void runLoop() {
        running.countDown();
        try {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    TimeUnit.MILLISECONDS.sleep(10);
                    cycles.incrementAndGet();
                } catch (InterruptedException exception) {
                    // sleep 会清除中断标志，恢复它让循环条件观察到停止请求。
                    Thread.currentThread().interrupt();
                }
            }
        } finally {
            stopped.countDown();
        }
    }

    @Override
    public void close() throws InterruptedException {
        if (!started.get()) {
            return;
        }
        worker.interrupt();
        worker.join(Duration.ofSeconds(2).toMillis());
        if (worker.isAlive()) {
            throw new IllegalStateException("工作线程未能按时停止");
        }
    }
}
