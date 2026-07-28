package com.caesaemc.juc.lesson04;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * 练习：使用 CAS 保证余额不会被扣成负数。
 */
public final class BoundedBalanceExercise {

    private final AtomicInteger balance;

    public BoundedBalanceExercise(int initialBalance) {
        balance = new AtomicInteger(initialBalance);
    }

    public boolean withdraw(int amount) {
        // TODO：把 check-then-act 改成 CAS 循环。
        if (balance.get() < amount) {
            return false;
        }
        balance.set(balance.get() - amount);
        return true;
    }

    public int balance() {
        return balance.get();
    }
}
