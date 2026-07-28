package com.caesaemc.juc.lesson04;

import com.caesaemc.juc.lesson01.Counter;

import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;

/**
 * 使用 VarHandle CAS 循环实现无锁计数器。
 */
public final class VarHandleCounter implements Counter {

    private static final VarHandle VALUE;

    static {
        try {
            VALUE = MethodHandles.lookup()
                    .findVarHandle(VarHandleCounter.class, "value", int.class);
        } catch (ReflectiveOperationException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @SuppressWarnings("FieldMayBeFinal")
    private volatile int value;

    @Override
    public void increment() {
        int observed;
        do {
            observed = (int) VALUE.getVolatile(this);
        } while (!VALUE.compareAndSet(this, observed, observed + 1));
    }

    @Override
    public int value() {
        return (int) VALUE.getVolatile(this);
    }
}
