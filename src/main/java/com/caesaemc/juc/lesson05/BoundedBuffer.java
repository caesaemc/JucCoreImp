package com.caesaemc.juc.lesson05;

import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 使用一把锁和两个条件队列实现有界缓冲区。
 */
public final class BoundedBuffer<E> {

    private final Object[] elements;
    private final ReentrantLock lock;
    private final Condition notEmpty;
    private final Condition notFull;

    private int putIndex;
    private int takeIndex;
    private int count;

    public BoundedBuffer(int capacity, boolean fair) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("capacity 必须大于 0");
        }
        elements = new Object[capacity];
        lock = new ReentrantLock(fair);
        notEmpty = lock.newCondition();
        notFull = lock.newCondition();
    }

    public void put(E element) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (count == elements.length) {
                notFull.await();
            }
            elements[putIndex] = element;
            putIndex = (putIndex + 1) % elements.length;
            count++;
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    @SuppressWarnings("unchecked")
    public E take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (count == 0) {
                notEmpty.await();
            }
            E element = (E) elements[takeIndex];
            elements[takeIndex] = null;
            takeIndex = (takeIndex + 1) % elements.length;
            count--;
            notFull.signal();
            return element;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }

    public boolean isFair() {
        return lock.isFair();
    }
}
