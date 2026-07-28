package com.caesaemc.juc.lesson07;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 练习：把分离的 get/put 改为原子加载。
 */
public final class CacheExercise {

    private final ConcurrentHashMap<String, String> values = new ConcurrentHashMap<>();
    private final AtomicInteger loadCount = new AtomicInteger();

    public String get(String key) {
        String value = values.get(key);
        if (value == null) {
            // TODO：改用 computeIfAbsent，并保证 loader 不递归修改同一个 key。
            value = load(key);
            values.put(key, value);
        }
        return value;
    }

    private String load(String key) {
        loadCount.incrementAndGet();
        return "value-" + key;
    }

    public int loadCount() {
        return loadCount.get();
    }
}
