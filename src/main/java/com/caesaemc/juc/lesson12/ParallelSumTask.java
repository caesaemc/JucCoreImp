package com.caesaemc.juc.lesson12;

import java.util.concurrent.RecursiveTask;

/**
 * ForkJoin 递归分治求和。
 */
public final class ParallelSumTask extends RecursiveTask<Long> {

    private static final int THRESHOLD = 1_024;

    private final int[] values;
    private final int start;
    private final int end;

    public ParallelSumTask(int[] values) {
        this(values, 0, values.length);
    }

    private ParallelSumTask(int[] values, int start, int end) {
        this.values = values;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            long sum = 0;
            for (int index = start; index < end; index++) {
                sum += values[index];
            }
            return sum;
        }

        int middle = (start + end) >>> 1;
        ParallelSumTask left = new ParallelSumTask(values, start, middle);
        ParallelSumTask right = new ParallelSumTask(values, middle, end);
        left.fork();
        long rightResult = right.compute();
        return left.join() + rightResult;
    }
}
