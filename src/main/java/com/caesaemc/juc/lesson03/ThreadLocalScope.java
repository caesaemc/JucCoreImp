package com.caesaemc.juc.lesson03;

import java.util.Objects;
import java.util.concurrent.Callable;

/**
 * 用 try/finally 限定 ThreadLocal 值的生命周期。
 */
public final class ThreadLocalScope {

    private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();

    private ThreadLocalScope() {
    }

    public static String currentRequestId() {
        return REQUEST_ID.get();
    }

    public static <T> T callWithRequestId(String requestId, Callable<T> action)
            throws Exception {
        Objects.requireNonNull(requestId, "requestId");
        Objects.requireNonNull(action, "action");

        String previous = REQUEST_ID.get();
        REQUEST_ID.set(requestId);
        try {
            return action.call();
        } finally {
            if (previous == null) {
                REQUEST_ID.remove();
            } else {
                REQUEST_ID.set(previous);
            }
        }
    }
}
