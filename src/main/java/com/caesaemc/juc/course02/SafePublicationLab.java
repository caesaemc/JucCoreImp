package com.caesaemc.juc.course02;

import java.util.Objects;

/**
 * 先构造不可变快照，再通过一次 volatile 引用写完成安全发布。
 */
public final class SafePublicationLab {

    private SafePublicationLab() {
    }

    public static final class ConfigRepository {
        private volatile Settings current;

        public ConfigRepository(Settings initial) {
            current = Objects.requireNonNull(initial, "initial");
        }

        public Settings snapshot() {
            // 读一次共享入口，后续字段都来自同一个版本。
            return current;
        }

        public void update(Settings settings) {
            // settings 已完整构造；这一步只替换引用，不逐字段修改旧对象。
            current = Objects.requireNonNull(settings, "settings");
        }
    }

    public record Settings(int version, int timeoutMillis, int retries) {
        public Settings {
            if (version < 0 || timeoutMillis <= 0 || retries < 0) {
                throw new IllegalArgumentException("配置值不合法");
            }
        }
    }
}
