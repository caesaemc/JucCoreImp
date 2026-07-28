package com.caesaemc.juc.jcstress;

import org.openjdk.jcstress.annotations.Actor;
import org.openjdk.jcstress.annotations.Arbiter;
import org.openjdk.jcstress.annotations.Expect;
import org.openjdk.jcstress.annotations.JCStressTest;
import org.openjdk.jcstress.annotations.Outcome;
import org.openjdk.jcstress.annotations.State;
import org.openjdk.jcstress.infra.results.I_Result;

/**
 * 两个非原子 value++ 可能丢失一次更新。
 */
@JCStressTest
@Outcome(id = "2", expect = Expect.ACCEPTABLE,
        desc = "两个更新都被观察到。")
@Outcome(id = "1", expect = Expect.ACCEPTABLE_INTERESTING,
        desc = "两个 actor 读取同一旧值，发生丢失更新。")
@Outcome(expect = Expect.FORBIDDEN,
        desc = "该测试模型中不应出现的结果。")
@State
public class LostUpdateStress {

    private int value;

    @Actor
    public void actor1() {
        value++;
    }

    @Actor
    public void actor2() {
        value++;
    }

    @Arbiter
    public void arbiter(I_Result result) {
        result.r1 = value;
    }
}
