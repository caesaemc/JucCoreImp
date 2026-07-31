package com.caesaemc.juc.v3.labs.lesson01;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CountDownLatch;

/**
 * {@code DEMO}：构造真实的监视器死锁，并让 JVM 的线程管理接口给出证据。
 *
 * <p>两个守护线程按相反顺序获取监视器。门闩保证二者都持有第一把锁后才尝试第二把锁，
 * 所以不依赖 {@code sleep} 或机器速度。守护线程使演示结束后不会阻止 JVM 退出。
 */
public final class DeadlockDemo {

    private DeadlockDemo() {
    }

    /**
     * 创建一个死锁并等待 JVM 检测到完整环路。
     *
     * @param timeout 检测死锁的最大等待时间，只作为失败上限，不参与线程交错
     */
    public static DeadlockReport createAndDetect(Duration timeout) throws InterruptedException {
        Objects.requireNonNull(timeout, "timeout");
        if (timeout.isZero() || timeout.isNegative()) {
            throw new IllegalArgumentException("timeout 必须大于 0");
        }

        NamedMonitor registryMonitor = new NamedMonitor("task-registry-monitor");
        NamedMonitor statisticsMonitor = new NamedMonitor("task-statistics-monitor");
        CountDownLatch bothFirstMonitorsHeld = new CountDownLatch(2);

        Thread registryThenStatistics = deadlockingWorker(
                "deadlock-registry-then-statistics",
                registryMonitor,
                statisticsMonitor,
                bothFirstMonitorsHeld);
        Thread statisticsThenRegistry = deadlockingWorker(
                "deadlock-statistics-then-registry",
                statisticsMonitor,
                registryMonitor,
                bothFirstMonitorsHeld);

        registryThenStatistics.start();
        statisticsThenRegistry.start();
        bothFirstMonitorsHeld.await();

        Set<Long> expectedWorkerIds = Set.of(
                registryThenStatistics.threadId(), statisticsThenRegistry.threadId());
        ThreadMXBean threadMxBean = ManagementFactory.getThreadMXBean();
        long deadline = System.nanoTime() + timeout.toNanos();

        do {
            long[] allDeadlockedIds = threadMxBean.findDeadlockedThreads();
            if (allDeadlockedIds != null) {
                Set<Long> detectedIds = toIdSet(allDeadlockedIds);
                if (detectedIds.containsAll(expectedWorkerIds)) {
                    return report(threadMxBean, expectedWorkerIds, detectedIds);
                }
            }
            Thread.onSpinWait();
        } while (System.nanoTime() - deadline < 0);

        throw new IllegalStateException("JVM 未在 " + timeout + " 内检测到预期死锁");
    }

    private static Thread deadlockingWorker(
            String name,
            Object firstMonitor,
            Object secondMonitor,
            CountDownLatch bothFirstMonitorsHeld) {
        Thread worker = Thread.ofPlatform().name(name).unstarted(() -> {
            synchronized (firstMonitor) {
                bothFirstMonitorsHeld.countDown();
                await(bothFirstMonitorsHeld);
                synchronized (secondMonitor) {
                    throw new AssertionError("真正的死锁中不可能到达这里");
                }
            }
        });
        worker.setDaemon(true);
        return worker;
    }

    private static DeadlockReport report(
            ThreadMXBean threadMxBean,
            Set<Long> expectedWorkerIds,
            Set<Long> detectedIds) {
        long[] lessonWorkerIds = expectedWorkerIds.stream().mapToLong(Long::longValue).toArray();
        List<ThreadSnapshot> snapshots = Arrays.stream(
                        threadMxBean.getThreadInfo(lessonWorkerIds, true, true))
                .map(info -> new ThreadSnapshot(
                        info.getThreadId(),
                        info.getThreadName(),
                        info.getThreadState(),
                        info.getLockName(),
                        info.getLockOwnerId(),
                        info.getLockOwnerName()))
                .toList();
        return new DeadlockReport(Set.copyOf(expectedWorkerIds), Set.copyOf(detectedIds), snapshots);
    }

    private static Set<Long> toIdSet(long[] ids) {
        Set<Long> result = new LinkedHashSet<>();
        Arrays.stream(ids).forEach(result::add);
        return result;
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("实验线程在等待另一把监视器时被中断", interrupted);
        }
    }

    private record NamedMonitor(String name) {
        @Override
        public String toString() {
            return name;
        }
    }

    /** JVM 对一个死锁线程的关键观测数据。 */
    public record ThreadSnapshot(
            long threadId,
            String threadName,
            Thread.State state,
            String waitingForLock,
            long lockOwnerId,
            String lockOwnerName) {
    }

    /** 检测报告同时保留本实验线程和 JVM 当时检测到的全部死锁线程。 */
    public record DeadlockReport(
            Set<Long> lessonWorkerIds,
            Set<Long> allDetectedDeadlockedIds,
            List<ThreadSnapshot> lessonWorkers) {
        public boolean detectedBothLessonWorkers() {
            return allDetectedDeadlockedIds.containsAll(lessonWorkerIds);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        DeadlockReport report = createAndDetect(Duration.ofSeconds(2));
        System.out.println("JVM 已检测到课程死锁环：" + report.detectedBothLessonWorkers());
        report.lessonWorkers().forEach(worker -> System.out.printf(
                "%s[%d] 状态=%s, 等待=%s, 持有者=%s[%d]%n",
                worker.threadName(), worker.threadId(), worker.state(), worker.waitingForLock(),
                worker.lockOwnerName(), worker.lockOwnerId()));

        if (Arrays.asList(args).contains("--hold")) {
            System.out.printf("%n诊断模式已保持进程，PID=%d。请在另一终端执行：%n",
                    ProcessHandle.current().pid());
            System.out.printf("jcmd %d Thread.print -l%n", ProcessHandle.current().pid());
            System.out.println("取得线程转储后按 Ctrl+C 结束本进程。");
            new CountDownLatch(1).await();
        }
    }
}
