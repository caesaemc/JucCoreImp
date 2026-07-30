# 第 06 课：可靠性、排障与综合项目

> 状态：未开始
>
> 建议用时：2 × 90 分钟
>
> 学习页面：[打开第 06 课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=06)

这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。独立的
`course06` 主源码构成最终实战：为多下游聚合请求建立容量、时间、取消和结果边界，
再用可重复测试、线程转储、指标和 JFR 证明系统行为。

## Todo

- [ ] 读完本课讲义并写出四类系统边界
- [ ] 播放聚合动画并解释 deadline、permit、Future 和 outcomes[]
- [ ] 阅读并运行可靠性、诊断与综合项目源码
- [ ] 重写 `Course06Exercise` 并通过测试
- [ ] 不看答案口述三道面试题

## 正确学习路径

1. 先定义容量边界：入口、线程、队列、下游并发分别允许多少。
2. 再定义时间边界：总 deadline 与单下游 timeout 怎样共同生效。
3. 再定义结果协议：成功、失败、超时、拒绝和取消怎样区分。
4. 再定义降级规则：哪些失败可以返回部分结果，哪些必须整体失败。
5. 最后用测试、线程 dump、指标和 JFR 验证设计。

## 只记三句话

1. 入口并发、排队长度、下游许可和等待时间都必须有明确上限。
2. 超时、取消、拒绝和业务失败是不同终态，必须分别记录和处理。
3. 排障先取得线程状态和调用指标证据，再讨论加线程或换并发工具。

可靠性检查口诀：

```text
请求能进入多少                  → 入口并发上限
任务能排队多少                  → 有界队列
下游能同时调用多少              → Semaphore / 连接池
整条请求最多多久                → overall deadline
单个下游最多多久                → per-call timeout
失败后返回什么                  → Outcome + 降级协议
怎样证明问题                    → 可重复测试 + dump + metrics + JFR
```

## 从不变量开始设计

在选择锁、线程池或虚拟线程前，先写出系统不变量：

- 同一个请求只有一个总截止时间。
- 每个下游调用最多进入一个终态。
- 任何路径都不能泄漏 Semaphore 许可。
- 结果顺序与调用输入顺序稳定，不依赖完成顺序。
- 队列、线程和在途调用数量都不能无限增长。
- 关闭时不再接收新任务，并处理已接纳任务。

并发工具只是实现这些不变量的手段。

## Timeout 与 Deadline

timeout 表示“从现在开始最多等待多久”；deadline 表示“整条操作必须在
哪个绝对时刻前结束”。

错误做法是每一步重新使用完整 timeout：

```text
获取许可等待 500ms
下游 A 再等待 500ms
下游 B 再等待 500ms
```

这样总时间会不断累加。正确做法是在入口计算一次 deadline：

```java
DeadlineBudget budget = DeadlineBudget.after(overallTimeout);
long remaining = budget.remainingNanos();
future.get(remaining, NANOSECONDS);
```

单下游限制应与总剩余预算取最小值：

```text
effectiveTimeout = min(call.timeout, budget.remaining)
```

应使用 `System.nanoTime()` 这类单调时间源计算耗时和剩余预算，不使用会
发生墙上时间跳变的日期时间。

## Bulkhead 与容量

Bulkhead 把一个下游或资源池的故障隔离在自己的容量内。项目使用公平
Semaphore 表达真实资源并发：

```java
permits.acquire();
try {
    return action.call();
} finally {
    permits.release();
}
```

许可必须在 `finally` 中释放。只有成功获得许可后才能进入释放逻辑，否则
可能错误增加许可数量。

虚拟线程可以让大量任务等待，但不能代替 Bulkhead。执行线程是承载任务
的机制，许可才表达数据库、连接、远程系统等真实容量。

队列与 Semaphore 解决不同问题：

- 队列限制等待执行的任务数量和内存。
- Semaphore 限制已经进入关键资源的在途数量。

## Future 取消与终态

一个下游调用至少应区分：

```text
SUCCESS    正常返回值
FAILED     业务或执行异常
TIMED_OUT  超过时间预算
REJECTED   提交时容量已满
CANCELLED  上游中断或主动取消
```

`future.cancel(true)` 只尝试中断任务。调用方仍要：

- 记录是超时触发还是外部取消。
- 避免同一个调用被重复计数。
- 取消对应定时器。
- 释放已经取得的许可。
- 保留可定位的失败类型和耗时。

终态记录可使用一次性 CAS 标志，防止 worker 完成和 timeout scheduler
同时记录同一调用。

## 部分结果与降级

降级不是“catch 住所有异常继续返回”。它是业务协议：

- 关键下游失败：可能整体失败。
- 非关键下游失败：保留成功值并标记 degraded。
- 超时：明确记录 `TIMED_OUT`，不能伪装成空数据。
- 拒绝：说明系统已经达到容量边界，应快速失败或使用约定 fallback。

`AggregationResponse` 同时携带：

- 按输入顺序排列的每个 `CallOutcome`。
- 成功值集合。
- 是否 degraded。
- 是否存在关键失败。
- 整体耗时。

这样调用方和监控系统读取的是同一份事实。

## 并发测试与诊断

不能用一次随机运行证明并发代码正确。测试应尽量控制时序：

- CountDownLatch：让多个 actor 准备完成后同时开始。
- CyclicBarrier：控制多阶段交错。
- 阻塞桩：稳定制造线程池饱和或队列堆积。
- 共享 deadline：测试失败时取消其他 actor，避免测试挂死。

不同工具回答不同问题：

```text
JUnit         → 业务行为和边界条件
jcstress      → Java 内存模型允许哪些结果
JMH           → 稳态吞吐和延迟比较
线程 dump     → 某一时刻线程卡在哪里
JFR           → 一段时间内 CPU、锁、分配、阻塞和线程事件
指标          → 线上趋势、容量和终态分布
```

线上吞吐下降时，先抓线程 dump：

- RUNNABLE 很多：检查 CPU 热点、忙等和系统调用。
- BLOCKED 很多：检查共同监视器和锁竞争。
- WAITING/TIMED_WAITING 很多：检查队列、Condition、Future 和下游等待。
- 线程池 active 已满且 queue 持续增长：检查慢任务和容量配置。

不要看到线程多就直接增加线程数。必须先确认瓶颈位于 CPU、锁、队列还是
外部依赖。

## 综合聚合服务

项目的聚合服务把前五课能力组合在一起：

1. 请求线程创建一个 `DeadlineBudget`。
2. 每个 DownstreamCall 被提交为 Future。
3. timeout scheduler 为每个调用安排取消任务。
4. worker 获取共享 Semaphore 许可后才能访问下游。
5. 调用完成后在 `finally` 中归还许可。
6. 调用结果按原索引写入 `outcomes[]`。
7. 聚合器返回完整或降级的 `AggregationResponse`。
8. 关闭流程拒绝新请求，等待或取消已接纳任务。

平台线程实现使用固定 Worker 和有界队列；虚拟线程实现每调用一个虚拟
线程。两种执行模型共享相同的 deadline、许可、结果和指标协议。

## 动画阅读方法

网页动画展示 capacity=2、overall deadline=800ms 的教学场景：

1. 请求创建总预算和固定长度 `outcomes[]`。
2. 三个调用建立 Future 和超时定时器。
3. profile、inventory 获得两个许可，recommendation 等待。
4. profile 成功并归还许可，recommendation 开始。
5. inventory 超时，Future 被取消并释放许可。
6. recommendation 成功，所有许可归还。
7. 聚合器返回 `PARTIAL · degraded=true`，并记录成功与超时指标。

每一步核对剩余预算、availablePermits、activeCalls、任务状态和
`outcomes[]`。

## 源码学习顺序

1. [DeadlineBudget.java](../../src/main/java/com/caesaemc/juc/course06/DeadlineBudget.java)：一次建立总截止时间。
2. [ConcurrentTestHarness.java](../../src/main/java/com/caesaemc/juc/course06/ConcurrentTestHarness.java)：可控并发测试和失败取消。
3. [ReliableAggregator.java](../../src/main/java/com/caesaemc/juc/course06/ReliableAggregator.java)：提交、限流、超时、取消、终态和有序收集。
4. [AggregationStrategies.java](../../src/main/java/com/caesaemc/juc/course06/AggregationStrategies.java)：有界平台线程池和虚拟线程策略。
5. [Course06Exercise.java](../../src/main/java/com/caesaemc/juc/course06/Course06Exercise.java)：限时 Bulkhead 练习。

运行本课：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.course06.Course06Application
```

## 一个练习

目标：实现一个具备公平许可、限时等待、超时 fallback 和异常安全释放的
Bulkhead。

修改
[Course06Exercise.java](../../src/main/java/com/caesaemc/juc/course06/Course06Exercise.java)。

```bash
mvn -q -Dtest=Course06ExerciseTest test
```

完成后能证明：许可不会在正常、受检异常、运行时异常或中断路径泄漏，
等待超时时不会执行真实下游调用。

## 三道面试题

### 1. 为什么队列、并发数和等待时间都要有上限？

它们分别控制排队内存、真实资源压力和尾延迟。任何一个无限增长，都可能
让局部过载扩散为整个系统不可用。

### 2. 线上线程很多但吞吐下降，第一步看什么？

先抓线程 dump，观察线程状态分布和共同调用栈，再结合线程池、队列、下游
耗时和终态指标判断瓶颈；不要先假设需要增加线程。

### 3. 平台线程池和虚拟线程怎样选择？

根据任务是 CPU 计算还是大量阻塞 I/O、运行环境和观测数据选择。两者都
必须共享明确的资源限流、deadline、取消、结果和关闭协议。

## 学习记录

### 2026-07-30：建立第六课独立源码

- `course06` 统一承载“边界 → deadline → bulkhead → 结果协议 → 证据”。
- 网页动画用一次部分成功的聚合请求串联容量、超时、取消和降级。
- 下一步：先手写系统边界清单，再阅读 `DeadlineBudget`。

## 有价值问答

- 问题：
- 当时怎么想：
- 正确结论：
- 代码或实验依据：
- 一句话面试回答：

## 课后复盘

- 我已经掌握：
- 我仍然容易混淆：
- 我能否解释每一层容量和时间边界：
- 一周后需要重新回答的问题：
