package com.caesaemc.juc.lesson05;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson05Test {

    @Test
    @Timeout(10)
    void mutexShouldProtectCriticalSection() throws Exception {
        Mutex mutex = new Mutex();
        AtomicInteger counter = new AtomicInteger();
        try (ExecutorService executor = Executors.newFixedThreadPool(8)) {
            Future<?>[] tasks = new Future<?>[8];
            for (int index = 0; index < tasks.length; index++) {
                tasks[index] = executor.submit(() -> {
                    for (int iteration = 0; iteration < 20_000; iteration++) {
                        mutex.lock();
                        try {
                            counter.set(counter.get() + 1);
                        } finally {
                            mutex.unlock();
                        }
                    }
                });
            }
            for (Future<?> task : tasks) {
                task.get();
            }
        }

        assertEquals(160_000, counter.get());
        assertFalse(mutex.isLocked());
    }

    @Test
    @Timeout(5)
    void conditionBufferShouldTransferInFifoOrder() throws Exception {
        BoundedBuffer<String> buffer = new BoundedBuffer<>(2, true);
        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            Future<String> firstTake = executor.submit(buffer::take);
            buffer.put("A");
            assertEquals("A", firstTake.get());
        }

        buffer.put("B");
        buffer.put("C");
        assertEquals("B", buffer.take());
        assertEquals("C", buffer.take());
        assertTrue(buffer.isFair());
    }
}
