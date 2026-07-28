package com.caesaemc.juc.lesson08;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

/**
 * 练习：先阻塞取得一个元素，再非阻塞批量 drain，避免空转轮询。
 */
public final class BatchingQueueExercise<T> {

    private final BlockingQueue<T> queue;

    public BatchingQueueExercise(BlockingQueue<T> queue) {
        this.queue = queue;
    }

    public List<T> takeBatch(int maxBatchSize) throws InterruptedException {
        // TODO：校验 maxBatchSize，take 一个，再 drainTo 最多 maxBatchSize - 1 个。
        return new ArrayList<>();
    }
}
