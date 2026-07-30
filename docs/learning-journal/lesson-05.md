# 第 05 课：线程池、异步任务与虚拟线程

> 状态：未开始
>
> 建议用时：2 × 90 分钟
>
> 学习页面：[打开第 05 课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=05)

这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。独立的
`course05` 主源码形成一条任务执行主线：任务如何被接纳、在哪里等待、由谁执行、怎样
返回结果、如何共享超时，以及平台线程和虚拟线程怎样选。

## Todo

- [ ] 读完本课讲义并能写出线程池接纳顺序
- [ ] 播放线程池动画并解释 Worker、workQueue 和拒绝
- [ ] 阅读并运行线程池、Future、CompletableFuture 和虚拟线程源码
- [ ] 重写 `Course05Exercise` 并通过测试
- [ ] 不看答案口述三道面试题

## 正确学习路径

1. 先掌握 `ThreadPoolExecutor.execute` 的四条接纳路径。
2. 再学习 Future 的完成、异常、取消和总截止时间。
3. 再学习 CompletableFuture 的依赖图与执行线程。
4. 再区分普通线程池、ForkJoinPool 和虚拟线程的任务模型。
5. 最后把执行载体与数据库、连接池、下游等真实资源容量分开。

## 只记三句话

1. 线程池接纳顺序是：核心 Worker、入队、非核心 Worker、拒绝。
2. 多个 Future 必须共享同一个总 deadline，否则逐个等待会累加总延迟。
3. 虚拟线程降低线程成本，但不会增加数据库连接数或下游容量。

选型口诀：

```text
少量长期 CPU 计算                  → 有界平台线程池
可拆分递归 CPU 任务                → ForkJoinPool
大量独立阻塞 I/O                   → 每任务一个虚拟线程
多个异步结果组合                   → CompletableFuture
任何外部稀缺资源                   → 单独 Semaphore / 连接池限流
```

## ThreadPoolExecutor 接纳路径

`execute(task)` 的主流程可以压缩为：

```text
如果 workerCount < corePoolSize
    创建核心 Worker(task)
否则如果 workQueue.offer(task) 成功
    任务入队，并重新检查线程池状态
否则如果 workerCount < maximumPoolSize
    创建非核心 Worker(task)
否则
    执行拒绝策略
```

队列类型会改变扩容行为：

- 无界队列通常会一直入队，使 `maximumPoolSize` 很难生效。
- 小型有界队列更早触发扩容和拒绝，容量边界清晰。
- `SynchronousQueue` 不保存任务，必须直接交给 Worker。

线程数不是越多越好。CPU 密集任务受核心数限制；阻塞任务还要考虑连接池、
下游并发、上下文切换、队列延迟和内存占用。

## Worker、ctl 与拒绝

ThreadPoolExecutor 需要同时维护运行状态和 Worker 数量。网页中把 `ctl`
逻辑拆成两个可读字段：

```text
runState    RUNNING / SHUTDOWN / STOP / TIDYING / TERMINATED
workerCount 当前 Worker 数量
```

Worker 对象、Worker 集合和 workQueue 属于堆对象状态；每个 Worker 绑定
的线程拥有独立调用栈。

拒绝不是异常设计失败，而是容量边界的输出信号。常见策略：

- AbortPolicy：抛 `RejectedExecutionException`。
- CallerRunsPolicy：由提交线程执行，形成自然反压。
- DiscardPolicy：静默丢弃，通常需要额外监控。
- DiscardOldestPolicy：丢最旧队列任务，必须确认业务允许。

生产代码应记录 submitted、active、queue size、completed、rejected 和任务
耗时，不能只看线程池是否还活着。

## Future、超时与取消

`execute` 只提交 Runnable；`submit` 返回 Future。Future 需要区分：

- 正常完成并携带结果。
- 任务抛异常，由 `get()` 包装为 `ExecutionException`。
- 被取消，`get()` 抛 `CancellationException`。
- 等待超时，调用者决定是否继续、取消或降级。

多个任务不能这样等待：

```java
futureA.get(500, MILLISECONDS);
futureB.get(500, MILLISECONDS);
futureC.get(500, MILLISECONDS);
```

最坏总等待可能接近 1500ms。正确方法是在入口计算一次绝对 deadline，
每次 `get` 都使用剩余预算。

`cancel(true)` 只是尝试中断正在运行的任务。任务是否快速结束仍取决于
中断协议、底层调用是否可取消以及业务清理代码。

## CompletableFuture 编排

CompletableFuture 表达的是依赖图：

```text
thenApply     对一个结果做同步转换
thenCompose   前一步返回另一个异步阶段，展开嵌套
thenCombine   两个独立阶段都完成后组合
allOf         等待多个阶段完成，本身不收集每个结果
handle        同时处理成功值和失败
exceptionally 只处理失败并提供替代值
```

不带 `Async` 的后续阶段通常可能由完成前一步的线程执行；带 `Async` 的
阶段使用指定 Executor，未指定时通常进入公共池。生产代码应显式决定：

- 哪个 Executor 执行阻塞任务。
- 哪个 Executor 执行 CPU 转换。
- 超时和异常怎样映射成业务 Outcome。
- MDC、Trace、租户等上下文怎样传递。

不要在公共 ForkJoinPool 中执行不可控的长阻塞调用。

## ForkJoinPool 与任务模型

ForkJoinPool 适合可递归拆分、子任务相对短小的 CPU 计算。Worker 优先
处理自己的双端队列，空闲 Worker 从其他队列窃取任务。

典型递归结构：

```text
任务足够小 → 直接 compute
任务较大   → 拆成 left/right
             fork 一个分支
             当前线程 compute 另一个分支
             join 并合并
```

阈值过小会产生大量任务管理开销，过大则并行度不足。阻塞操作需要
`ManagedBlocker` 或改用更适合阻塞 I/O 的执行模型。

## 虚拟线程

虚拟线程适合大量独立的阻塞式 I/O，让代码保持“一任务一线程”的直线
结构。它不适合通过线程池限制任务数量，因为虚拟线程本身就是廉价的执行
载体。

正确拆分：

```text
任务并发与代码结构        → 虚拟线程
数据库连接容量            → 连接池
下游同时请求数            → Semaphore
整组等待时间              → deadline
```

需要关注：

- 长时间 CPU 计算不会因为换成虚拟线程而变快。
- 特定同步或本地调用可能导致 carrier pinning，应通过 JFR 和运行数据判断。
- 大量 ThreadLocal 数据会按虚拟线程数量放大内存。
- 虚拟线程仍需要明确取消、结果和关闭协议。

## 动画阅读方法

网页动画使用 `core=1、max=2、queue=1` 的确定性场景：

1. 创建空线程池。
2. T1 创建核心 Worker-1。
3. T2 进入唯一的队列槽位。
4. T3 因队列已满而创建非核心 Worker-2。
5. T4 因 Worker 与队列都达到上限而被拒绝。
6. 阻塞任务释放后，某个空闲 Worker 取出 T2。
7. `shutdown` 后已接纳任务完成，Worker 退出。

第六步由哪个 Worker 取得 T2 取决于调度，动画展示的是一种合法时序，
不是唯一顺序。

## 源码学习顺序

1. [ThreadPoolDecisionLab.java](../../src/main/java/com/caesaemc/juc/course05/ThreadPoolDecisionLab.java)：确定性走过核心、入队、扩容和拒绝。
2. [DeadlineRunner.java](../../src/main/java/com/caesaemc/juc/course05/DeadlineRunner.java)：Future 超时与取消。
3. [AsyncAggregator.java](../../src/main/java/com/caesaemc/juc/course05/AsyncAggregator.java)：CompletableFuture 结果与异常归一化。
4. [VirtualThreadLab.java](../../src/main/java/com/caesaemc/juc/course05/VirtualThreadLab.java)：每任务一个虚拟线程，资源许可独立限流。
5. [Course05Exercise.java](../../src/main/java/com/caesaemc/juc/course05/Course05Exercise.java)：显式配置有界执行器。

运行本课：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.course05.Course05Application
```

## 一个练习

目标：完成一个具备容量边界、命名线程和明确拒绝策略的线程池配置。

修改
[Course05Exercise.java](../../src/main/java/com/caesaemc/juc/course05/Course05Exercise.java)，
不要使用无界队列和默认线程名。

```bash
mvn -q -Dtest=Course05ExerciseTest test
```

完成后能解释：为什么队列容量会影响 `maximumPoolSize` 是否生效，以及
拒绝策略怎样成为系统背压协议的一部分。

## 三道面试题

### 1. ThreadPoolExecutor 提交任务的顺序是什么？

先尝试创建核心 Worker，再尝试入队；入队失败后尝试创建非核心 Worker；
达到最大线程数后执行拒绝策略。

### 2. 多个 Future 为什么应该共享总 deadline？

如果每个 Future 都重新等待完整 timeout，总延迟会按 Future 数量累加。
共享 deadline 能让所有等待共同受调用方的总时间预算约束。

### 3. 使用虚拟线程后为什么仍然需要限流？

虚拟线程只降低线程创建和阻塞成本。数据库连接、文件描述符、远程服务和
其他真实资源容量没有增加，仍需连接池或 Semaphore 等机制保护。

## 学习记录

### 2026-07-30：建立第五课独立源码

- `course05` 统一承载“线程池接纳 → Future → 异步编排 → 虚拟线程”的学习主线。
- 网页动画以 `ThreadPoolDecisionLab` 的容量配置为依据。
- 下一步：不看讲义先写出 execute 的四条分支，再用动画核对。

## 有价值问答

- 问题：
- 当时怎么想：
- 正确结论：
- 代码或实验依据：
- 一句话面试回答：

## 课后复盘

- 我已经掌握：
- 我仍然容易混淆：
- 我能否根据任务类型选择执行模型：
- 一周后需要重新回答的问题：
