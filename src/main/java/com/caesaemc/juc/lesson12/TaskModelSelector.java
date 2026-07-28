package com.caesaemc.juc.lesson12;

/**
 * 任务形态到执行模型的教学选型器。
 */
public final class TaskModelSelector {

    private TaskModelSelector() {
    }

    public static Model select(TaskShape shape) {
        if (shape.recursiveCpuBound()) {
            return Model.FORK_JOIN;
        }
        if (shape.hasDependentStages()) {
            return Model.COMPLETABLE_FUTURE;
        }
        if (shape.mostlyBlocking() && shape.taskCount() >= 1_000) {
            return Model.VIRTUAL_THREADS;
        }
        return Model.PLATFORM_THREAD_POOL;
    }

    public record TaskShape(
            boolean recursiveCpuBound,
            boolean hasDependentStages,
            boolean mostlyBlocking,
            int taskCount
    ) {
    }

    public enum Model {
        FORK_JOIN,
        COMPLETABLE_FUTURE,
        VIRTUAL_THREADS,
        PLATFORM_THREAD_POOL
    }
}
