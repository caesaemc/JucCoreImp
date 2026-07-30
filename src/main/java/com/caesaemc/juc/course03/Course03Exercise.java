package com.caesaemc.juc.course03;

/**
 * 第三课练习参考实现：阻塞方法抛出 InterruptedException 后恢复中断并退出。
 */
public final class Course03Exercise {

    private Course03Exercise() {
    }

    public static void runUntilInterrupted(InterruptibleStep step) {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                step.run();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @FunctionalInterface
    public interface InterruptibleStep {
        void run() throws InterruptedException;
    }
}
