package com.caesaemc.juc.v3.taskhub.lesson01;

import java.util.Objects;

/**
 * {@code TASK}：第 01 课需要学习者完成的“不安全任务统计”。
 *
 * <p>本课目标是建立竞态条件的可重复证据，不是提前修复它。请保留普通 {@code int} 字段，
 * 不要加入锁、{@code volatile}、原子类或并发容器；这些方案将在后续课程逐一证明和比较。
 *
 * <p>验收要求：单线程调用不能丢计数；两个线程在探针处被安排为“都读完、再写回”时，
 * 必须稳定观测到一次丢失更新。
 */
public final class UnsafeTaskStatistics {

    /** 堆中被多个 TaskHub Worker 共享的普通字段，故意没有同步保护。 */
    private int completedTasks;

    /** 只用于实验观测与编排，生产式调用使用无操作探针。 */
    private final CompletionUpdateProbe updateProbe;

    public UnsafeTaskStatistics() {
        this(CompletionUpdateProbe.noOp());
    }

    public UnsafeTaskStatistics(CompletionUpdateProbe updateProbe) {
        this.updateProbe = Objects.requireNonNull(updateProbe, "updateProbe");
    }

    /**
     * 记录一个完成任务。
     *
     * <p>TODO：把一次更新明确拆成“读共享字段到局部变量 → 通知探针已读 → 局部值加一后
     * 写回共享字段”三个步骤。不要在本课修复数据竞争。
     */
    public void recordCompletedTask() {
        throw new UnsupportedOperationException("TODO lesson01: 实现不安全的读-改-写");
    }

    /** TODO：返回当前普通字段值，不要增加同步。 */
    public int completedTasks() {
        throw new UnsupportedOperationException("TODO lesson01: 返回 completedTasks");
    }

    /**
     * 读取完成后的观测点。验收测试通过它控制交错，但它不改变共享统计值。
     */
    @FunctionalInterface
    public interface CompletionUpdateProbe {
        void afterRead(int observedCompletedTasks);

        static CompletionUpdateProbe noOp() {
            return ignored -> {
            };
        }
    }
}
