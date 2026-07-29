# 第 15 课：并发测试、诊断与性能

## 交互式学习入口

[打开第 15 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=15)

网页包含本课 TODO、确定性测试流程、证据与故障数据分布、真实源码行号、练习和面试验收。

## 学习目标

1. 写出可重复、能失败、有限时的并发测试。
2. 理解单元测试、jcstress、JMH 和负载测试各自回答什么问题。
3. 用线程 dump 与线程池指标识别死锁、空转、堆积和锁竞争。
4. 录制并检查 JFR，而不是只凭线程数量猜测性能。
5. 建立“现象 → 证据 → 根因 → 修复 → 回归验证”的排障闭环。

## 1. 并发测试先控制时序

`sleep` 只能表达“希望它大概执行到这里”，不能建立 happens-before，也不能证明 actor 已就绪。

`ConcurrentTestHarness` 使用：

- ready latch：所有 actor 已进入起跑线。
- start latch：一次释放，建立明确的开始时序。
- 共享 deadline：准备和收集共用预算。
- Future：传播异常并在超时时取消剩余任务。

测试必须有外层 `@Timeout`，避免缺陷让构建永久挂起。

## 2. 四种验证工具不要混用

| 工具 | 回答的问题 | 不适合 |
|---|---|---|
| JUnit | 业务不变式、协议、可控时序 | 枚举 JMM 所有合法执行 |
| jcstress | 特定并发交错在 JVM 上可能出现什么 | 业务端到端测试 |
| JMH | 某段代码在规范基准下的性能 | 证明线程安全 |
| 负载测试 | 系统容量、排队、尾延迟和降级 | 解释单条机器指令 |

`jcstress/LostUpdateStress` 把结果分类为：

- `2`：两个更新都保留。
- `1`：合法但值得关注的丢失更新。
- 其他：在该模型中禁止。

## 3. JMH 为什么需要独立工程

JIT 可能消除没有被观察的代码，常量折叠输入；冷启动、GC、CPU 频率和同机噪声也会扭曲结果。JMH 负责 fork、预热、测量和结果消费。

本课基准比较 AtomicLong 与 LongAdder 的高竞争写入。它不意味着 LongAdder 在所有场景都更好：

- `sum()` 不是与并发写入线性一致的快照。
- 低竞争下分段结构可能没有收益。
- 结论只对当前硬件、JDK、参数和负载成立。

## 4. 先看哪份证据

```text
延迟/吞吐异常
├─ CPU 高
│  ├─ RUNNABLE 同栈集中 → 空转或热点计算
│  └─ 锁事件高 → 自旋/竞争
├─ CPU 低但请求慢
│  ├─ BLOCKED → monitor 竞争
│  ├─ WAITING/PARKED → 锁、Future、队列
│  └─ 网络/文件栈 → 下游或 I/O
└─ 队列持续增长
   ├─ 到达率大于处理率
   ├─ worker 被慢任务占满
   └─ 队列无界掩盖了拒绝
```

一次线程 dump 是照片。CPU 空转和死锁可快速暴露；吞吐与竞争问题通常要结合多次 dump、JFR 和业务指标。

## 5. 四类故障实验

`DiagnosticFaultLab` 提供四个独立进程模式：

- `deadlock`：两个 daemon 平台线程形成 monitor 死锁。
- `spin`：一个线程持续占用 CPU。
- `backlog`：两个 worker 被阻塞，队列稳定堆积。
- `contention`：一个持锁线程与多个 BLOCKED waiter。

启动后会打印 PID 和诊断命令。示例：

```bash
java -cp target/classes \
  com.caesaemc.juc.lesson15.DiagnosticFaultLab backlog 60

jcmd <pid> Thread.print -l
jstack -l <pid>
```

不要在生产 JVM 上无评估地开启高开销配置；先了解目标 JDK、持续时间、磁盘和安全权限。

## 6. JFR 与指标

`JfrRecordingDemo` 用 JFR API 录制线程休眠、park 和 monitor 竞争：

```bash
java -cp target/classes com.caesaemc.juc.lesson15.Lesson15Application
jfr summary target/lesson15-demo.jfr
jfr print --events jdk.JavaMonitorEnter target/lesson15-demo.jfr
```

线程池至少记录：

- active、pool size、queue size。
- submitted、started、completed、failed、rejected。
- 任务排队时间和执行时间直方图。
- 按业务/下游区分的 timeout 与 cancellation。

只看平均延迟会隐藏尾部堆积，至少观察 P95/P99 与队列等待。

## 7. 运行专项工程

JUnit 与 JFR：

```bash
mvn -Dtest=Lesson15Test test
```

JMH：

```bash
mvn -f benchmarks/pom.xml clean package
java -jar benchmarks/target/benchmarks.jar \
  -wi 3 -i 5 -f 1 CounterBenchmark
```

jcstress：

```bash
mvn -f jcstress/pom.xml clean package
java -jar jcstress/target/jcstress.jar \
  -t '.*LostUpdateStress.*'
```

短参数只用于确认工程能运行；正式结论需要足够 fork、迭代和稳定环境。

## 8. 代码导航

- `ConcurrentTestHarness`
- `QueueBacklogLab`
- `JfrRecordingDemo`
- `DiagnosticFaultLab`
- `benchmarks/CounterBenchmark`
- `jcstress/LostUpdateStress`

## 9. 完成标准

- [ ] 测试不依赖随机 sleep 触发竞态。
- [ ] 能解释 JUnit、jcstress、JMH、负载测试的边界。
- [ ] 能从线程状态与栈定位四类实验。
- [ ] 能录制、汇总并查看一份 JFR。
- [ ] 能给出至少一个性能结论的适用范围。

## 官方参考

- [JDK Flight Recorder API](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.jfr/module-summary.html)
- [jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
- [jstack](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstack.html)
- [OpenJDK JMH](https://github.com/openjdk/jmh)
- [OpenJDK jcstress](https://github.com/openjdk/jcstress)
