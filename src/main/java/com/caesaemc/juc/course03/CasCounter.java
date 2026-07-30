package com.caesaemc.juc.course03;

import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;

/**
 * CAS 的线性化点是 compareAndSet 成功的瞬间；失败线程重新读取后再计算。
 */
public final class CasCounter {

    private static final VarHandle VALUE;

    static {
        try {
            VALUE = MethodHandles.lookup().findVarHandle(CasCounter.class, "value", int.class);
        } catch (ReflectiveOperationException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @SuppressWarnings("FieldMayBeFinal")
    private volatile int value;

    public void increment() {
        int observed;
        do {
            observed = (int) VALUE.getVolatile(this);
        } while (!VALUE.compareAndSet(this, observed, observed + 1));
    }

    public int value() {
        return (int) VALUE.getVolatile(this);
    }
}
