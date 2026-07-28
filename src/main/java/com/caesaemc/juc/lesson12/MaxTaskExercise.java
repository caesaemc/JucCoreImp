package com.caesaemc.juc.lesson12;

import java.util.concurrent.RecursiveTask;

/**
 * 练习：实现数组最大值的递归分治。
 */
public final class MaxTaskExercise extends RecursiveTask<Integer> {

    private final int[] values;
    private final int start;
    private final int end;

    public MaxTaskExercise(int[] values) {
        this(values, 0, values.length);
    }

    private MaxTaskExercise(int[] values, int start, int end) {
        this.values = values;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Integer compute() {
        // TODO：小任务顺序求最大值，大任务一分为二并合并结果。
        return values[start];
    }
}
