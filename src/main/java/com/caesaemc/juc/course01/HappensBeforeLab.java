package com.caesaemc.juc.course01;

/**
 * start 把调用线程之前的写交给工作线程，join 把工作线程的写带回调用线程。
 */
public final class HappensBeforeLab {

    private HappensBeforeLab() {
    }

    public static Result run() throws InterruptedException {
        State state = new State();
        state.input = 42;

        Thread worker = new Thread(() -> {
            state.observedInput = state.input;
            state.output = state.input * 2;
        }, "course01-happens-before");

        worker.start();
        worker.join();
        return new Result(state.observedInput, state.output);
    }

    private static final class State {
        private int input;
        private int observedInput;
        private int output;
    }

    public record Result(int observedInput, int outputAfterJoin) {
    }
}
