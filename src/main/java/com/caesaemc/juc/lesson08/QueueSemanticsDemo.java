package com.caesaemc.juc.lesson08;

import java.time.Duration;
import java.util.concurrent.Delayed;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;

/**
 * 演示零容量直接移交和延迟队列元素协议。
 */
public final class QueueSemanticsDemo {

    private QueueSemanticsDemo() {
    }

    public static String directHandoff(String value) throws InterruptedException {
        SynchronousQueue<String> queue = new SynchronousQueue<>();
        Thread producer = Thread.ofPlatform().start(() -> {
            try {
                queue.put(value);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        });
        String received = queue.take();
        producer.join();
        return received;
    }

    public static final class DelayedValue implements Delayed {
        private final String value;
        private final long readyAtNanos;

        public DelayedValue(String value, Duration delay) {
            this.value = value;
            readyAtNanos = System.nanoTime() + delay.toNanos();
        }

        public String value() {
            return value;
        }

        @Override
        public long getDelay(TimeUnit unit) {
            return unit.convert(readyAtNanos - System.nanoTime(), TimeUnit.NANOSECONDS);
        }

        @Override
        public int compareTo(Delayed other) {
            return Long.compare(
                    getDelay(TimeUnit.NANOSECONDS),
                    other.getDelay(TimeUnit.NANOSECONDS)
            );
        }
    }
}
