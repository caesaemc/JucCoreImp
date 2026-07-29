# 第 09 课：ThreadPoolExecutor 原理

## 交互式学习入口

[打开第 09 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=09)

网页包含本课 TODO、execute 四路径推演、Worker/队列/ctl 数据分布、真实源码行号、练习和面试验收。

## 学习目标

1. 完整讲解 `execute` 的四条路径。
2. 理解核心线程、最大线程和工作队列的联动。
3. 设计有界队列、命名线程和拒绝策略。
4. 理解 Worker、ctl 和线程池状态的源码角色。
5. 为线程池建立最低可用监控。

## 1. execute 主流程

简化为：

```text
workerCount < corePoolSize
    尝试创建核心 Worker
否则线程池运行中且 queue.offer 成功
    入队并二次检查运行状态
否则
    尝试创建非核心 Worker，最多 maximumPoolSize
    创建失败则拒绝
```

`ThreadPoolDecisionModel` 把这四条路径做成可测试模型。

二次检查很重要：任务入队和线程池 shutdown 可能并发发生。如果入队后发现不再运行，需要尝试移除并拒绝。

## 2. 队列决定扩容行为

- 无界队列：达到 core 后通常一直入队，maximumPoolSize 基本不参与扩容。
- 有界队列：队列满后才继续创建到 maximum。
- SynchronousQueue：不能缓存任务，更倾向直接创建/移交。

参数不能孤立调优。核心数、最大数、队列容量和拒绝策略共同定义系统过载行为。

## 3. Worker 与 ctl

源码阅读重点：

- `ctl` 把运行状态和 worker 数量编码在一个原子整数中。
- Worker 同时代表工作线程和任务执行循环。
- Worker 自身基于 AQS 控制中断等生命周期操作。
- `getTask` 决定线程是否继续等待、超时退出或结束。

不要求背二进制常量，但必须理解状态和 workerCount 需要原子协调。

## 4. 拒绝策略

- AbortPolicy：抛异常，最明确。
- CallerRunsPolicy：调用者执行，形成一定反压，但调用线程语义会改变。
- DiscardPolicy：静默丢弃，必须有明确业务允许和指标。
- DiscardOldestPolicy：丢弃队头，可能丢掉等待最久任务。
- 自定义：落盘、降级、按业务优先级处理。

拒绝不是“错误兜底”，而是容量设计的一部分。

## 5. ThreadFactory

生产线程应具备：

- 可识别名称。
- 明确 daemon 策略。
- UncaughtExceptionHandler。
- 必要但受控的上下文初始化。

线程名称直接影响 dump 和 JFR 的排障效率。

## 6. 可观测性

`InstrumentedThreadPool` 展示：

- beforeExecute：记录开始数。
- afterExecute：记录完成和失败。
- 拒绝处理器：记录拒绝数。
- active 和 queue size：瞬时指标。

生产还应记录：

- 入队到执行的等待时间。
- 任务执行时间。
- 队列容量利用率。
- 最大活跃数。
- shutdown 状态。

## 7. 饱和实验

`PoolSaturationDemo` 配置：

```text
core = 1
max = 2
queue = 1
```

前三个阻塞任务依次走核心线程、队列、非核心线程；第四个被拒绝。

## 8. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson09.Lesson09Application
```

## 9. 完成标准

- [ ] 能画出 execute 流程。
- [ ] 能解释无界队列为何使 max 失效。
- [ ] 能比较四种拒绝策略。
- [ ] 能解释 ctl 和 Worker 的角色。
- [ ] 能列出线程池核心指标。
- [ ] 完成 `PoolConfigExercise`。

## 官方参考

- [ThreadPoolExecutor API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
- [OpenJDK ThreadPoolExecutor 源码](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/concurrent/ThreadPoolExecutor.java)
