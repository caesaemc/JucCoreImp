package com.caesaemc.juc.lesson04;

import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicStampedReference;

/**
 * 同一个引用从 A 变为 B 再回到 A，普通 CAS 无法识别中间变化。
 */
public final class AbaDemo {

    private AbaDemo() {
    }

    public static AbaResult demonstrate() {
        AtomicReference<String> plain = new AtomicReference<>("A");
        String plainObserved = plain.get();
        plain.compareAndSet("A", "B");
        plain.compareAndSet("B", "A");
        boolean plainAccepted = plain.compareAndSet(plainObserved, "C");

        AtomicStampedReference<String> stamped = new AtomicStampedReference<>("A", 0);
        int[] stampHolder = new int[1];
        String stampedObserved = stamped.get(stampHolder);
        int originalStamp = stampHolder[0];
        stamped.compareAndSet("A", "B", 0, 1);
        stamped.compareAndSet("B", "A", 1, 2);
        boolean stampedAccepted =
                stamped.compareAndSet(stampedObserved, "C", originalStamp, originalStamp + 1);

        return new AbaResult(plainAccepted, stampedAccepted, stamped.getStamp());
    }

    public record AbaResult(
            boolean plainCasAccepted,
            boolean stampedCasAccepted,
            int finalStamp
    ) {
    }
}
