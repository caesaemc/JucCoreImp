package com.caesaemc.juc.lesson09;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

/**
 * 使用钩子、命名线程和有界队列构建可观测线程池。
 */
public final class InstrumentedThreadPool extends ThreadPoolExecutor {

    private final Metrics metrics;

    public InstrumentedThreadPool(
            int corePoolSize,
            int maximumPoolSize,
            int queueCapacity,
            String threadPrefix
    ) {
        this(
                corePoolSize,
                maximumPoolSize,
                queueCapacity,
                new Metrics(),
                namedThreadFactory(threadPrefix)
        );
    }

    private InstrumentedThreadPool(
            int corePoolSize,
            int maximumPoolSize,
            int queueCapacity,
            Metrics metrics,
            ThreadFactory threadFactory
    ) {
        super(
                corePoolSize,
                maximumPoolSize,
                30,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(queueCapacity),
                threadFactory,
                new CountingAbortPolicy(metrics)
        );
        this.metrics = metrics;
    }

    @Override
    protected void beforeExecute(Thread thread, Runnable task) {
        metrics.started.increment();
        super.beforeExecute(thread, task);
    }

    @Override
    protected void afterExecute(Runnable task, Throwable failure) {
        try {
            Throwable actualFailure = failure;
            if (actualFailure == null && task instanceof Future<?> future && future.isDone()) {
                try {
                    future.get();
                } catch (Exception exception) {
                    actualFailure = exception;
                }
            }
            if (actualFailure != null) {
                metrics.failed.increment();
            }
            metrics.completed.increment();
        } finally {
            super.afterExecute(task, failure);
        }
    }

    public MetricsSnapshot metrics() {
        return new MetricsSnapshot(
                metrics.started.sum(),
                metrics.completed.sum(),
                metrics.failed.sum(),
                metrics.rejected.sum(),
                getActiveCount(),
                getQueue().size()
        );
    }

    private static ThreadFactory namedThreadFactory(String prefix) {
        AtomicInteger sequence = new AtomicInteger();
        return task -> Thread.ofPlatform()
                .name(prefix + "-" + sequence.incrementAndGet())
                .unstarted(task);
    }

    private static final class CountingAbortPolicy implements RejectedExecutionHandler {
        private final Metrics metrics;

        private CountingAbortPolicy(Metrics metrics) {
            this.metrics = metrics;
        }

        @Override
        public void rejectedExecution(Runnable task, ThreadPoolExecutor executor) {
            metrics.rejected.increment();
            throw new RejectedExecutionException("线程池和队列均已饱和");
        }
    }

    private static final class Metrics {
        private final LongAdder started = new LongAdder();
        private final LongAdder completed = new LongAdder();
        private final LongAdder failed = new LongAdder();
        private final LongAdder rejected = new LongAdder();
    }

    public record MetricsSnapshot(
            long started,
            long completed,
            long failed,
            long rejected,
            int active,
            int queued
    ) {
    }
}
