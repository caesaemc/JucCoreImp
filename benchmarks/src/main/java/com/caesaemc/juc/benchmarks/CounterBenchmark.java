package com.caesaemc.juc.benchmarks;

import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Group;
import org.openjdk.jmh.annotations.GroupThreads;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * 对比高竞争写入。结果只适用于本机、本 JVM 和当前参数。
 */
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
public class CounterBenchmark {

    @State(Scope.Group)
    public static class AtomicState {
        final AtomicLong counter = new AtomicLong();
    }

    @State(Scope.Group)
    public static class AdderState {
        final LongAdder counter = new LongAdder();
    }

    @Benchmark
    @Group("atomic")
    @GroupThreads(8)
    public long atomicIncrement(AtomicState state) {
        return state.counter.incrementAndGet();
    }

    @Benchmark
    @Group("adder")
    @GroupThreads(8)
    public void adderIncrement(AdderState state) {
        state.counter.increment();
    }
}
