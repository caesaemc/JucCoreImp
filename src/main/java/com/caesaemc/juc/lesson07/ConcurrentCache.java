package com.caesaemc.juc.lesson07;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * 使用 computeIfAbsent 原子完成“缺失时加载”。
 */
public final class ConcurrentCache<K, V> {

    private final ConcurrentHashMap<K, V> values = new ConcurrentHashMap<>();
    private final Function<K, V> loader;

    public ConcurrentCache(Function<K, V> loader) {
        this.loader = Objects.requireNonNull(loader, "loader");
    }

    public V get(K key) {
        return values.computeIfAbsent(key, loader);
    }

    public void invalidate(K key) {
        values.remove(key);
    }

    public int estimatedSize() {
        return values.size();
    }
}
