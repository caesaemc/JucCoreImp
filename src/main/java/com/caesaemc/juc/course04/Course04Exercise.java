package com.caesaemc.juc.course04;

import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * 第四课练习参考实现：让同一个 key 的建立进入 ConcurrentHashMap 的原子协议。
 */
public final class Course04Exercise<K, V> {

    private final ConcurrentHashMap<K, V> cache = new ConcurrentHashMap<>();

    public V load(K key, Function<? super K, ? extends V> loader) {
        return cache.computeIfAbsent(key, loader);
    }
}
