# 第 13 课：虚拟线程与结构化并发

## 学习目标

1. 理解虚拟线程、平台线程和 carrier 的关系。
2. 使用 thread-per-task 编写阻塞风格代码。
3. 不用虚拟线程池表达资源容量。
4. 理解 ThreadLocal、pinning 和诊断边界。
5. 理解结构化并发解决的生命周期问题。

## 1. 虚拟线程

虚拟线程是由 JVM 调度的轻量 Thread。阻塞在受支持的 JDK 操作时，虚拟线程通常可以卸载，carrier 平台线程转去运行其他虚拟线程。

JDK 21 正式 API：

```java
Thread.ofVirtual().start(task);
Executors.newVirtualThreadPerTaskExecutor();
```

虚拟线程的价值：

- 大量相互独立的阻塞任务。
- 保留直线型代码、异常和堆栈。
- 减少“线程数量必须很少”带来的复杂异步编排。

它不会让 CPU 密集代码超越核心数并行度。

## 2. 每任务一线程

虚拟线程非常便宜，典型模式是每个任务创建一个虚拟线程，而不是维护一个固定大小的虚拟线程池。

`VirtualThreadAggregator` 使用 `newVirtualThreadPerTaskExecutor`，并通过 `invokeAll(timeout)` 为整组任务设置总时间边界。

## 3. 资源容量

虚拟线程便宜，不代表下列资源无限：

- 数据库连接。
- 外部 API 并发额度。
- 文件描述符。
- 内存中的请求体。
- 对方服务容量。

不要用“池里只有 20 个虚拟线程”表达数据库最多 20 并发。使用连接池或 Semaphore：

```text
任务数量：由虚拟线程承载
资源并发：由 Semaphore/连接池承载
```

`LimitedVirtualThreadService` 展示这种分离。

## 4. 阻塞和 pinning

JDK 21 中，虚拟线程在某些 synchronized 临界区或 native/foreign 调用期间阻塞时可能固定 carrier。后续 JDK 持续改进 synchronized 相关 pinning，因此排障必须以目标 JDK 为准。

实践：

- 不在长时间 synchronized 区域内执行阻塞 I/O。
- 使用 JFR 的虚拟线程事件。
- 必要时通过 `-Djdk.tracePinnedThreads=full` 在支持的版本上观察。
- 不为了规避 pinning 机械替换所有 synchronized；先测量。

## 5. ThreadLocal

每个虚拟线程都支持 ThreadLocal，但“支持百万线程”意味着每线程大对象会被放大：

- 避免重量级缓存。
- 生命周期结束时清理。
- 连接池资源不能放在线程本地永久占用。
- 上下文优先显式传递，或评估 ScopedValue。

## 6. 结构化并发

结构化并发让父任务的代码块拥有子任务生命周期：

```text
进入 scope
fork 子任务
join/截止时间
按策略处理失败
离开 scope 前确保所有子任务结束
```

它改善：

- 取消传播。
- 异常聚合。
- 子任务泄漏。
- 线程 dump 中的任务层次。

在 JDK 21 中 StructuredTaskScope 和 ScopedValue 属于预览 API，需要 `--enable-preview`；后续版本 API 仍可能变化。因此本课程把概念列为必学，但主 Maven 工程只编译正式 API。使用时必须按目标 JDK 文档调整。

## 7. 代码导航

- `VirtualThreadAggregator`
- `LimitedVirtualThreadService`
- `VirtualResourceExercise`

## 8. 运行

本课要求 JDK 21：

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson13.Lesson13Application
```

## 9. 完成标准

- [ ] 能解释 virtual 与 carrier。
- [ ] 能说明虚拟线程为何不需要池化。
- [ ] 能为外部资源单独限流。
- [ ] 能说明 pinning 的版本边界。
- [ ] 能解释结构化并发的父子生命周期。
- [ ] 完成 `VirtualResourceExercise`。

## 官方参考

- [Thread API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [Executors](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html)
- [JEP 444 Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 453 Structured Concurrency (Preview)](https://openjdk.org/jeps/453)
