package com.caesaemc.juc.lesson09;

/**
 * ThreadPoolExecutor.execute 主路径的教学模型。
 */
public final class ThreadPoolDecisionModel {

    private ThreadPoolDecisionModel() {
    }

    public static Decision decide(
            boolean running,
            int workers,
            int corePoolSize,
            int maximumPoolSize,
            boolean queueOfferSucceeds
    ) {
        if (!running) {
            return Decision.REJECT;
        }
        if (workers < corePoolSize) {
            return Decision.START_CORE_WORKER;
        }
        if (queueOfferSucceeds) {
            return Decision.ENQUEUE;
        }
        if (workers < maximumPoolSize) {
            return Decision.START_NON_CORE_WORKER;
        }
        return Decision.REJECT;
    }

    public enum Decision {
        START_CORE_WORKER,
        ENQUEUE,
        START_NON_CORE_WORKER,
        REJECT
    }
}
