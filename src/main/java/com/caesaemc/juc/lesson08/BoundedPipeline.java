package com.caesaemc.juc.lesson08;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;

/**
 * 有界队列将生产速率反压到生产者。
 */
public final class BoundedPipeline {

    private BoundedPipeline() {
    }

    public static List<Integer> square(
            List<Integer> inputs,
            int capacity,
            int consumerCount
    ) throws InterruptedException {
        BlockingQueue<Message> queue = new ArrayBlockingQueue<>(capacity);
        List<Integer> outputs = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch consumersDone = new CountDownLatch(consumerCount);

        for (int index = 0; index < consumerCount; index++) {
            Thread.ofPlatform().name("pipeline-consumer-" + index).start(() -> {
                try {
                    while (true) {
                        Message message = queue.take();
                        if (message.poison()) {
                            return;
                        }
                        outputs.add(message.value() * message.value());
                    }
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    consumersDone.countDown();
                }
            });
        }

        for (Integer input : inputs) {
            queue.put(new Message(input, false));
        }
        for (int index = 0; index < consumerCount; index++) {
            queue.put(new Message(0, true));
        }
        consumersDone.await();
        return List.copyOf(outputs);
    }

    private record Message(int value, boolean poison) {
    }
}
