package com.caesaemc.juc.lesson02;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson02Test {

    @Test
    @Timeout(10)
    void shouldPublishOnlyConsistentImmutableSnapshots() throws InterruptedException {
        SafePublicationDemo.ConsistencyResult result =
                SafePublicationDemo.verify(10_000, 50_000);

        assertTrue(result.consistent());
        assertTrue(result.finalSettings().isConsistent());
    }

    @Test
    @Timeout(10)
    void dclShouldReturnOneInstanceToAllThreads() throws InterruptedException {
        int threadCount = 32;
        Set<DclSingleton> instances = ConcurrentHashMap.newKeySet();
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threadCount);

        for (int index = 0; index < threadCount; index++) {
            Thread.ofPlatform().start(() -> {
                try {
                    start.await();
                    instances.add(DclSingleton.instance());
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        start.countDown();
        done.await();

        assertEquals(1, instances.size());
    }
}
