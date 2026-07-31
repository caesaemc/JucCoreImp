package com.caesaemc.juc.v3.labs.lesson01;

import java.util.List;
import java.util.concurrent.CountDownLatch;

/**
 * {@code DEMO}：用受控交错稳定复现“读-改-写”导致的丢失更新。
 *
 * <p>这个类是只读实验，不是正确计数器的参考实现。两个线程会先把堆中同一个
 * {@code completedTasks} 读入各自的线程私有局部快照，随后分别写回，因此每次运行都会
 * 丢失一次更新。这里不对 JIT 最终把局部值放在栈还是寄存器作物理存储承诺。
 */
public final class LostUpdateDemo {

    private LostUpdateDemo() {
    }

    /**
     * 执行一次确定性的错误交错；这里的门闩只负责实验编排，不负责保护共享字段。
     */
    public static Result runOnce() throws InterruptedException {
        UnsafeCounter heapCounter = new UnsafeCounter();
        CountDownLatch bothThreadsPreparedWrite = new CountDownLatch(2);
        Observation[] observations = new Observation[2];

        Thread workerA = worker("lost-update-worker-a", 0, heapCounter,
                bothThreadsPreparedWrite, observations);
        Thread workerB = worker("lost-update-worker-b", 1, heapCounter,
                bothThreadsPreparedWrite, observations);

        workerA.start();
        workerB.start();
        workerA.join();
        workerB.join();

        return new Result(2, heapCounter.completedTasks, List.of(observations));
    }

    private static Thread worker(
            String name,
            int observationIndex,
            UnsafeCounter heapCounter,
            CountDownLatch bothThreadsPreparedWrite,
            Observation[] observations) {
        return Thread.ofPlatform().name(name).unstarted(() -> {
            // 线程私有执行上下文：两个局部快照都会读到 0；JIT 可选择实际存储位置。
            int localSnapshot = heapCounter.completedTasks;
            int valueToWrite = localSnapshot + 1;
            observations[observationIndex] =
                    new Observation(Thread.currentThread().getName(), localSnapshot, valueToWrite);

            // 测试夹具：确保任意线程写回前，两个线程都已基于旧值准备好写回值。
            // 它保证错误结果稳定出现，但不规定 A/B 的实际调度先后。
            bothThreadsPreparedWrite.countDown();
            await(bothThreadsPreparedWrite);

            // 堆：两个线程先后把同一个值 1 写回，第二次写不会把结果推进到 2。
            heapCounter.completedTasks = valueToWrite;
        });
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("实验线程在受控交错期间被中断", interrupted);
        }
    }

    /** 堆中的共享可变对象；字段故意没有任何同步保护。 */
    private static final class UnsafeCounter {
        private int completedTasks;
    }

    /** 一次线程私有局部读取以及随后准备写回的值。 */
    public record Observation(String threadName, int localSnapshotRead, int heapValueWritten) {
    }

    /** 实验结果：逻辑上完成两次更新，堆字段最终只增加一次。 */
    public record Result(int expectedCompletedTasks, int actualCompletedTasks,
                         List<Observation> observations) {
        public int lostUpdates() {
            return expectedCompletedTasks - actualCompletedTasks;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Result result = runOnce();
        result.observations().forEach(observation -> System.out.printf(
                "%s: 私有快照读取=%d, 准备写回堆=%d%n",
                observation.threadName(),
                observation.localSnapshotRead(),
                observation.heapValueWritten()));
        System.out.printf("期望完成=%d, 堆中实际=%d, 丢失更新=%d%n",
                result.expectedCompletedTasks(), result.actualCompletedTasks(), result.lostUpdates());
    }
}
