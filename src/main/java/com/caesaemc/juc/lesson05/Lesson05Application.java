package com.caesaemc.juc.lesson05;

public final class Lesson05Application {

    private Lesson05Application() {
    }

    public static void main(String[] args) throws Exception {
        Mutex mutex = new Mutex();
        mutex.lock();
        try {
            System.out.println("Mutex 已加锁：" + mutex.isLocked());
        } finally {
            mutex.unlock();
        }

        BoundedBuffer<String> buffer = new BoundedBuffer<>(2, false);
        buffer.put("A");
        buffer.put("B");
        System.out.printf("FIFO：%s, %s%n", buffer.take(), buffer.take());
    }
}
