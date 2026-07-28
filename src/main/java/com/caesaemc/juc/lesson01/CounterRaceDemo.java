package com.caesaemc.juc.lesson01;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 通过多轮并发累加观察丢失更新。
 *
 * <p>这个实验用于观察竞态，不应作为自动化测试：错误程序也可能偶然得到正确结果。</p>
 */
public final class CounterRaceDemo {

    private static final int DEFAULT_THREAD_COUNT = 4;
    private static final int DEFAULT_INCREMENTS_PER_THREAD = 100_000;
    private static final int DEFAULT_TRIALS = 5;

    private CounterRaceDemo() {
    }

    public static CounterResult runTrial(
            Counter counter,
            int threadCount,
            int incrementsPerThread
    ) throws InterruptedException {
        Objects.requireNonNull(counter, "counter");
        if (threadCount <= 0) {
            throw new IllegalArgumentException("threadCount 必须大于 0");
        }
        if (incrementsPerThread <= 0) {
            throw new IllegalArgumentException("incrementsPerThread 必须大于 0");
        }

        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch finished = new CountDownLatch(threadCount);
        List<Thread> workers = new ArrayList<>(threadCount);

        for (int index = 0; index < threadCount; index++) {
            Thread worker = new Thread(() -> {
                ready.countDown();
                try {
                    startGate.await();
                    for (int iteration = 0; iteration < incrementsPerThread; iteration++) {
                        counter.increment();
                    }
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    finished.countDown();
                }
            }, "counter-worker-" + index);
            workers.add(worker);
            worker.start();
        }

        if (!ready.await(5, TimeUnit.SECONDS)) {
            workers.forEach(Thread::interrupt);
            throw new IllegalStateException("工作线程未能及时就绪");
        }

        startGate.countDown();

        if (!finished.await(30, TimeUnit.SECONDS)) {
            workers.forEach(Thread::interrupt);
            throw new IllegalStateException("计数任务未能及时完成");
        }

        int expected = Math.multiplyExact(threadCount, incrementsPerThread);
        return new CounterResult(expected, counter.value());
    }

    public static void main(String[] args) throws InterruptedException {
        printTrials("UnsafeCounter", UnsafeCounter::new);
        printTrials("SynchronizedCounter", SynchronizedCounter::new);
    }

    private static void printTrials(String name, Supplier<Counter> counterFactory)
            throws InterruptedException {
        System.out.println("\n" + name);
        for (int trial = 1; trial <= DEFAULT_TRIALS; trial++) {
            CounterResult result = runTrial(
                    counterFactory.get(),
                    DEFAULT_THREAD_COUNT,
                    DEFAULT_INCREMENTS_PER_THREAD
            );
            System.out.printf(
                    "第 %d 轮：期望=%d，实际=%d，丢失=%d%n",
                    trial,
                    result.expected(),
                    result.actual(),
                    result.lostUpdates()
            );
        }
    }

    public record CounterResult(int expected, int actual) {

        public int lostUpdates() {
            return expected - actual;
        }

        public boolean isCorrect() {
            return expected == actual;
        }
    }
}
