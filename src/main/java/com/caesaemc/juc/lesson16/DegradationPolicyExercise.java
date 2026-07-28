package com.caesaemc.juc.lesson16;

/**
 * 练习：把底层多结果协议映射为接口层决策。
 */
public final class DegradationPolicyExercise {

    private DegradationPolicyExercise() {
    }

    public static Decision decide(AggregationResponse response) {
        // TODO：关键下游失败为 FAILED；仅非关键失败为 PARTIAL；全部成功为 OK。
        return Decision.OK;
    }

    public enum Decision {
        OK,
        PARTIAL,
        FAILED
    }
}
