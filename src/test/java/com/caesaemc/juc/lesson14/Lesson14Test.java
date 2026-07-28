package com.caesaemc.juc.lesson14;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Lesson14Test {

    @Test
    @Timeout(5)
    void memoizerShouldRunOneLoadPerKey() throws Exception {
        Memoizer<String, String> memoizer = new Memoizer<>();
        AtomicInteger loads = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<String>> futures = new ArrayList<>();
            for (int index = 0; index < 30; index++) {
                futures.add(executor.submit(() -> {
                    start.await();
                    return memoizer.compute("same-key", () -> {
                        loads.incrementAndGet();
                        return "value";
                    });
                }));
            }
            start.countDown();
            for (Future<String> future : futures) {
                assertEquals("value", future.get());
            }
        }

        assertEquals(1, loads.get());
        assertEquals(1, memoizer.size());
    }

    @Test
    void failedMemoizedLoadShouldBeRemovedForRetry() throws Exception {
        Memoizer<String, String> memoizer = new Memoizer<>();
        AtomicInteger loads = new AtomicInteger();

        assertThrows(IllegalStateException.class, () -> memoizer.compute("key", () -> {
            loads.incrementAndGet();
            throw new IllegalStateException("temporary");
        }));

        assertEquals("recovered", memoizer.compute("key", () -> {
            loads.incrementAndGet();
            return "recovered";
        }));
        assertEquals(2, loads.get());
    }

    @Test
    @Timeout(5)
    void aggregatorShouldRespectCapacityAndPreserveOrder() throws Exception {
        BoundedAggregator aggregator = new BoundedAggregator(2);
        List<BoundedAggregator.NamedTask<Integer>> tasks = new ArrayList<>();
        for (int index = 0; index < 12; index++) {
            int value = index;
            tasks.add(new BoundedAggregator.NamedTask<>("task-" + index, () -> {
                Thread.sleep(5);
                return value;
            }));
        }

        List<BoundedAggregator.Outcome<Integer>> outcomes =
                aggregator.aggregate(tasks, Duration.ofSeconds(2));

        assertEquals(12, outcomes.size());
        assertEquals(
                java.util.stream.IntStream.range(0, 12).boxed().toList(),
                outcomes.stream().map(BoundedAggregator.Outcome::value).toList()
        );
        assertTrue(aggregator.maxObservedConcurrency() <= 2);
    }

    @Test
    @Timeout(5)
    void sharedDeadlineShouldCancelSlowTask() throws Exception {
        CountDownLatch interrupted = new CountDownLatch(1);
        BoundedAggregator aggregator = new BoundedAggregator(1);

        List<BoundedAggregator.Outcome<String>> outcomes = aggregator.aggregate(
                List.of(new BoundedAggregator.NamedTask<>("slow", () -> {
                    try {
                        Thread.sleep(10_000);
                        return "late";
                    } catch (InterruptedException exception) {
                        interrupted.countDown();
                        throw exception;
                    }
                })),
                Duration.ofMillis(30)
        );

        assertEquals(BoundedAggregator.Status.TIMED_OUT, outcomes.getFirst().status());
        assertTrue(interrupted.await(1, TimeUnit.SECONDS));
    }
}
