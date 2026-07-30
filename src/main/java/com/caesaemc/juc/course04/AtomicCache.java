package com.caesaemc.juc.course04;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * 使用容器提供的复合原子 API，避免在多个公开方法之间留下竞态窗口。
 */
public final class AtomicCache<K, V> {

    private final ConcurrentHashMap<K, V> values = new ConcurrentHashMap<>();

    public V get(K key, Function<? super K, ? extends V> loader) {
        Objects.requireNonNull(loader, "loader");
        return values.computeIfAbsent(key, loader);
    }

    public int size() {
        return values.size();
    }
}
