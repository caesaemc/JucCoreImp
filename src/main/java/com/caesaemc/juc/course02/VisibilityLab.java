package com.caesaemc.juc.course02;

import java.time.Duration;

/**
 * volatile 适合发布独立状态，例如停止标志；它不提供复合更新的互斥。
 */
public final class VisibilityLab implements AutoCloseable {

    private volatile boolean running;
    private Thread worker;

    public void start() {
        if (running) {
            throw new IllegalStateException("任务已经启动");
        }
        running = true;
        worker = new Thread(() -> {
            while (running) {
                Thread.onSpinWait();
            }
        }, "course02-visibility");
        worker.start();
    }

    @Override
    public void close() throws InterruptedException {
        running = false;
        if (worker != null) {
            worker.join(Duration.ofSeconds(1).toMillis());
            if (worker.isAlive()) {
                throw new IllegalStateException("工作线程没有观察到停止标志");
            }
        }
    }
}
