package com.caesaemc.juc.lesson02;

public final class Lesson02Application {

    private Lesson02Application() {
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("=== volatile 计数器仍会丢失更新 ===");
        VolatileCounterDemo.main(args);

        System.out.println("\n=== 不可变快照的安全发布 ===");
        SafePublicationDemo.main(args);

        System.out.println("\n=== DCL 单例 ===");
        DclSingleton first = DclSingleton.instance();
        DclSingleton second = DclSingleton.instance();
        System.out.println("两次访问是否为同一实例：" + (first == second));
    }
}
