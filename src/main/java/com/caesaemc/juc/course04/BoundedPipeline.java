package com.caesaemc.juc.course04;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

/**
 * 有界队列既传递数据，也把满载压力传回生产者；结束信号让消费者明确退出。
 */
public final class BoundedPipeline {

    private static final String END = new String("END");

    private BoundedPipeline() {
    }

    public static List<String> run(List<String> input, int capacity)
            throws InterruptedException {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(capacity);
        List<String> output = new ArrayList<>();

        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    String item = queue.take();
                    if (item == END) {
                        return;
                    }
                    output.add(item.toUpperCase());
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }, "course04-consumer");

        consumer.start();
        for (String item : input) {
            queue.put(item);
        }
        queue.put(END);
        consumer.join();
        return List.copyOf(output);
    }
}
