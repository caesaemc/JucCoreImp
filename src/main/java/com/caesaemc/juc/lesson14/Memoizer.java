package com.caesaemc.juc.lesson14;

import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;

/**
 * 为同一个 key 只保留一个正在执行的计算，失败或取消后允许重试。
 */
public final class Memoizer<K, V> {

    private final ConcurrentHashMap<K, Future<V>> cache = new ConcurrentHashMap<>();

    public V compute(K key, Callable<V> loader) throws Exception {
        Objects.requireNonNull(key, "key");
        Objects.requireNonNull(loader, "loader");

        while (true) {
            Future<V> future = cache.get(key);
            if (future == null) {
                FutureTask<V> candidate = new FutureTask<>(loader);
                future = cache.putIfAbsent(key, candidate);
                if (future == null) {
                    future = candidate;
                    candidate.run();
                }
            }

            try {
                return future.get();
            } catch (CancellationException exception) {
                cache.remove(key, future);
            } catch (ExecutionException exception) {
                cache.remove(key, future);
                throw rethrow(exception.getCause());
            }
        }
    }

    public void invalidate(K key) {
        Future<V> removed = cache.remove(key);
        if (removed != null) {
            removed.cancel(true);
        }
    }

    public int size() {
        return cache.size();
    }

    private static Exception rethrow(Throwable failure) throws Exception {
        if (failure instanceof Exception exception) {
            return exception;
        }
        if (failure instanceof Error error) {
            throw error;
        }
        return new RuntimeException(failure);
    }
}
