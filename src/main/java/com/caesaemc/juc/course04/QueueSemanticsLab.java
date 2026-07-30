package com.caesaemc.juc.course04;

import java.util.concurrent.SynchronousQueue;

/**
 * SynchronousQueue 容量为零：每次 put 都必须和某个 take 直接配对。
 */
public final class QueueSemanticsLab {

    private QueueSemanticsLab() {
    }

    public static String handOff(String value) throws InterruptedException {
        SynchronousQueue<String> handoff = new SynchronousQueue<>();
        Thread producer = new Thread(() -> {
            try {
                handoff.put(value);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }, "course04-producer");
        producer.start();
        String received = handoff.take();
        producer.join();
        return received;
    }
}
