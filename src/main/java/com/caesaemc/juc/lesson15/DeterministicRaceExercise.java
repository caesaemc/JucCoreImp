package com.caesaemc.juc.lesson15;

/**
 * 练习：不用 sleep，让两个线程确定地读到相同旧值后再写回。
 */
public final class DeterministicRaceExercise {

    private DeterministicRaceExercise() {
    }

    public static int exposeLostUpdate() throws Exception {
        // TODO：用两个阶段的屏障控制“读取”和“写入”，最终稳定返回 1。
        throw new UnsupportedOperationException("请完成 exposeLostUpdate");
    }
}
