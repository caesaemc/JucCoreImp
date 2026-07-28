package com.caesaemc.juc.lesson01;

/**
 * 演示 Thread.start 和 Thread.join 建立的 happens-before 关系。
 *
 * <p>这里的字段故意没有使用 volatile，也没有使用 synchronized。</p>
 */
public final class HappensBeforeDemo {

    private HappensBeforeDemo() {
    }

    public static HappensBeforeResult demonstrate() throws InterruptedException {
        SharedState state = new SharedState();

        // 该写操作发生在 start() 之前。
        state.input = 42;

        Thread worker = new Thread(() -> {
            // start 规则保证工作线程能够看到 input == 42。
            state.observedByWorker = state.input;
            state.output = state.input * 2;
        }, "happens-before-worker");

        worker.start();
        worker.join();

        // join 规则保证主线程能够看到工作线程对这两个字段的写入。
        return new HappensBeforeResult(state.observedByWorker, state.output);
    }

    public static void main(String[] args) throws InterruptedException {
        HappensBeforeResult result = demonstrate();
        System.out.printf(
                "工作线程观察到 input=%d，主线程在 join 后观察到 output=%d%n",
                result.observedByWorker(),
                result.outputAfterJoin()
        );
    }

    private static final class SharedState {
        private int input;
        private int observedByWorker;
        private int output;
    }

    public record HappensBeforeResult(int observedByWorker, int outputAfterJoin) {
    }
}
