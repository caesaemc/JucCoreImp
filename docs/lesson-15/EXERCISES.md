# 第 15 课练习

## 必做：确定性丢失更新

完成 `DeterministicRaceExercise.exposeLostUpdate`：

1. 两个 actor 各读取一次共享 `int`。
2. 用屏障确认二者都完成读取。
3. 再让二者各自写回 `old + 1`。
4. 不使用 sleep，不重试，结果每次都应为 1。

完成后移除 `DeterministicRaceExerciseTest` 上的 `@Disabled`。

## 必做：四类故障报告

依次运行 deadlock、spin、backlog、contention，每类记录：

- 现象和 PID。
- 至少一份线程 dump 的关键线程与状态。
- 相关线程池指标或 CPU 证据。
- 根因，不只写“线程太多”。
- 修复方案与回归测试。

## 基准评审

修改 JMH 的 group thread 数为 1、2、4、8、16，记录 AtomicLong/LongAdder：

- 吞吐变化。
- 误差范围。
- CPU 核数和 JDK 版本。
- 为什么不能把这份结果直接等同于业务吞吐。

## jcstress 扩展

增加一个 message-passing 测试：

```java
int data;
boolean ready;
```

分别测试普通 ready 与 volatile ready，并用 Outcome 明确列出可接受、值得关注和禁止结果。
