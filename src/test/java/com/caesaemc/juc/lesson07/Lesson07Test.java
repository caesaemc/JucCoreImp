package com.caesaemc.juc.lesson07;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class Lesson07Test {

    @Test
    @Timeout(10)
    void cacheShouldLoadOneValuePerKeyAtomically() throws InterruptedException {
        AtomicInteger loads = new AtomicInteger();
        ConcurrentCache<String, String> cache = new ConcurrentCache<>(key -> {
            loads.incrementAndGet();
            return "value-" + key;
        });
        int threadCount = 32;
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threadCount);

        for (int index = 0; index < threadCount; index++) {
            Thread.ofPlatform().start(() -> {
                try {
                    start.await();
                    cache.get("same");
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        start.countDown();
        done.await();

        assertEquals(1, loads.get());
        assertEquals(1, cache.estimatedSize());
    }

    @Test
    void shouldExposeDifferenceBetweenCompoundAndAtomicOperations() throws Exception {
        assertEquals(2, CompoundActionDemo.brokenCheckThenAct().creationCount());
        assertEquals(1, CompoundActionDemo.atomicCompute().creationCount());
    }

    @Test
    void copyOnWriteRegistryShouldPublishStableSnapshot() {
        CopyOnWriteRegistry<String> registry = new CopyOnWriteRegistry<>();
        AtomicInteger calls = new AtomicInteger();
        registry.register(event -> calls.incrementAndGet());
        registry.publish("event");

        assertEquals(1, calls.get());
        assertEquals(1, registry.snapshot().size());
    }
}
