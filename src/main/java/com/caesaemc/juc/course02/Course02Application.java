package com.caesaemc.juc.course02;

import com.caesaemc.juc.course02.SafePublicationLab.ConfigRepository;
import com.caesaemc.juc.course02.SafePublicationLab.Settings;

public final class Course02Application {

    private Course02Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        try (VisibilityLab visibility = new VisibilityLab()) {
            visibility.start();
        }

        ConfigRepository repository = new ConfigRepository(new Settings(0, 100, 1));
        repository.update(new Settings(1, 250, 2));

        System.out.printf("安全发布后的配置：%s%n", repository.snapshot());
        System.out.printf("DCL 单例创建时间：%d%n", DclSingleton.instance().createdAtNanos());
    }
}
