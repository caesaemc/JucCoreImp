package com.caesaemc.juc.lesson07;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * 读多写少的监听器注册表。
 */
public final class CopyOnWriteRegistry<T> {

    private final CopyOnWriteArrayList<Consumer<T>> listeners = new CopyOnWriteArrayList<>();

    public void register(Consumer<T> listener) {
        listeners.addIfAbsent(listener);
    }

    public void unregister(Consumer<T> listener) {
        listeners.remove(listener);
    }

    public void publish(T event) {
        for (Consumer<T> listener : listeners) {
            listener.accept(event);
        }
    }

    public List<Consumer<T>> snapshot() {
        return List.copyOf(listeners);
    }
}
