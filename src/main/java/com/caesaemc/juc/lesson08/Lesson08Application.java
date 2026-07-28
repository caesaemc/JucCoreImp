package com.caesaemc.juc.lesson08;

import java.util.List;

public final class Lesson08Application {

    private Lesson08Application() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("流水线结果：" + BoundedPipeline.square(List.of(1, 2, 3, 4), 2, 2));
        System.out.println("SynchronousQueue 移交：" + QueueSemanticsDemo.directHandoff("payload"));
    }
}
