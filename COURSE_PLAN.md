# Java JUC 代码化课程总体规划

## 1. 课程定位

- 适用对象：有 8 年左右 Java 开发经验，希望系统补齐 JUC，并准备中高级面试。
- 课程形式：仓库一次性提供完整代码与材料，学习时仍按顺序一次专注一课。
- 课程规模：8 周、16 课，每周建议学习 2 课，每课约 3～5 小时。
- 学习目标：
  1. 正确使用常见并发 API。
  2. 能依据 Java 内存模型解释并发结果。
  3. 能读懂 AQS、ConcurrentHashMap、ThreadPoolExecutor、CompletableFuture 的核心源码。
  4. 能设计、测试和排查生产级并发程序。
  5. 能用“结论、原理、边界、场景、取舍”的结构回答面试题。

## 2. 技术基线

- 构建工具：Maven。
- 主课程 JDK：JDK 21。
- 兼容视角：课程会说明 Java 8、17、21 之间与并发相关的重要差异。
- 测试工具：JUnit 5。
- 专项工具：
  - JMH：用于可靠的微基准测试。
  - jcstress：用于 Java 内存模型和并发正确性实验。
  - jcmd、jstack、JFR：用于诊断线程、锁竞争和线程池问题。

主工程统一以 JDK 21 编译，使虚拟线程课程和综合项目可以直接运行；版本差异在对应讲义中单独说明。

## 3. 每课的固定组成

每一课都可独立学习，包含以下内容：

1. `README.md`
   - 本课目标
   - 前置知识
   - 核心概念
   - 运行步骤
   - 常见误区

2. 演示代码
   - `BrokenDemo`：有意保留并发问题。
   - `FixedDemo`：一种或多种正确实现。
   - `SourceWalkthrough`：与源码核心流程对应的简化模型。

3. 测试代码
   - 正常行为测试。
   - 并发边界测试。
   - 超时和失败测试。
   - 尽量使用同步工具控制时序，避免依赖不稳定的 `sleep`。

4. 动手练习
   - `Exercise`：保留 TODO，由学习者先完成。
   - `Solution`：评审练习后再提供，避免提前看到答案。

5. 面试复盘
   - 5～10 道核心问题。
   - 1 道代码分析题。
   - 1 道生产场景题。

6. 完成标准
   - 能运行并解释所有示例。
   - 能完成练习并通过测试。
   - 能口述核心原理和适用边界。

## 4. 课程目录

### 第一阶段：并发语义与线程协作

#### 第 01 课：并发问题与 Java 内存模型

- 并发、并行、竞态条件和数据竞争。
- 原子性、可见性、有序性。
- happens-before 核心规则。
- CPU 缓存、缓存行、重排序只讲与 Java 代码直接相关的部分。
- 代码：错误计数器、可见性问题、结果统计实验。

验收：能够从 happens-before 角度解释一段代码是否线程安全。

#### 第 02 课：volatile、synchronized 与安全发布

- `volatile` 的语义及其不能保证的内容。
- `synchronized` 的互斥和内存语义。
- `final` 字段语义、安全发布、不可变对象。
- 双重检查单例及其成立条件。
- 代码：volatile 非原子操作、安全发布、DCL 单例。

验收：能够为共享状态选择正确的可见性和互斥方案。

#### 第 03 课：线程生命周期、中断与取消

- 线程状态、`start`、`join`、`wait/notify`。
- 中断标志、中断异常和中断传播。
- 协作式取消与两阶段终止。
- `ThreadLocal` 的用途、生命周期和泄漏风险。
- 代码：可取消任务、优雅停止、ThreadLocal 清理。

验收：能够实现不会吞掉中断的可取消任务。

#### 第 04 课：CAS、原子类与高竞争计数

- CAS、ABA、自旋及其代价。
- Atomic 系列、`AtomicStampedReference`。
- `LongAdder`、`LongAccumulator` 和分段竞争。
- VarHandle 的作用，Unsafe 仅作为源码背景。
- 代码：CAS 计数器、ABA 实验、AtomicLong 与 LongAdder 对比。

验收：能够解释 AtomicLong 和 LongAdder 的一致性与性能取舍。

### 第二阶段：锁、同步器与并发数据结构

#### 第 05 课：AQS、ReentrantLock 与 Condition

- AQS 的 `state`、等待队列、独占模式。
- 获取、入队、阻塞、唤醒和取消的核心流程。
- 公平锁与非公平锁。
- Condition 等待队列与同步队列的转换。
- 代码：简化版互斥锁、Condition 有界缓冲区。

验收：能够画出 AQS 加锁和释放的状态流转。

#### 第 06 课：同步工具与并发故障

- `CountDownLatch`、`Semaphore`、`CyclicBarrier` 的选型。
- `ReadWriteLock`、`StampedLock` 的适用边界。
- 死锁、活锁、饥饿和锁竞争。
- `Phaser`、`Exchanger` 作为扩展阅读。
- 代码：资源闸门、阶段任务、死锁复现与修复。

验收：能够根据业务约束选择同步器并识别死锁风险。

#### 第 07 课：ConcurrentHashMap 与并发集合

- ConcurrentHashMap 的线程安全语义。
- 复合操作、`compute`、`merge` 的正确使用。
- 扩容、计数和竞争控制的核心源码思路。
- CopyOnWrite 集合、ConcurrentSkipListMap 的选型。
- 弱一致迭代器。
- 代码：并发缓存、错误的 check-then-act、正确的原子更新。

验收：能够设计没有复合操作竞态的并发缓存。

#### 第 08 课：并发队列与生产消费

- ConcurrentLinkedQueue 和 BlockingQueue。
- ArrayBlockingQueue、LinkedBlockingQueue、SynchronousQueue。
- DelayQueue、PriorityBlockingQueue、TransferQueue 的使用场景。
- 队列容量、背压和内存风险。
- 代码：有界生产消费流水线、不同队列行为对比。

验收：能够结合吞吐、顺序、容量和延迟要求选择队列。

### 第三阶段：任务执行与现代并发

#### 第 09 课：ThreadPoolExecutor 原理

- Executor 体系。
- `corePoolSize`、`maximumPoolSize`、队列和线程创建规则。
- `ctl`、Worker、`execute` 的核心流程。
- 拒绝策略、ThreadFactory 和钩子方法。
- 代码：可观测线程池、队列满载与拒绝实验。

验收：能够完整解释任务提交后的所有可能路径。

#### 第 10 课：线程池工程实践、Future 与调度

- 有界队列、线程池隔离和容量规划。
- 异常捕获、任务取消、优雅关闭。
- FutureTask 状态机。
- ScheduledThreadPoolExecutor 的固定频率与固定延迟。
- 代码：安全关闭、异常感知执行器、周期任务对比。

验收：能够设计一个有界、可监控、可关闭的生产线程池。

#### 第 11 课：CompletableFuture 异步编排

- CompletionStage 与 CompletableFuture。
- 串行、并行、组合、竞争关系。
- 同步与 Async 方法的执行线程。
- 异常、超时、取消和自定义执行器。
- 代码：多下游聚合、统一 deadline、部分失败和降级。

验收：能够写出没有线程池混用和异常丢失的异步流程。

#### 第 12 课：ForkJoinPool 与任务模型选型

- 分治、工作窃取、公共线程池。
- 阻塞任务对 ForkJoinPool 的影响。
- 并行流的适用场景和常见风险。
- 平台线程池、CompletableFuture、ForkJoin 的选型。
- Flow API 作为扩展阅读。
- 代码：递归任务、阻塞任务对比、并行流陷阱。

验收：能够根据任务依赖、阻塞比例和计算特征选择执行模型。

#### 第 13 课：虚拟线程与结构化并发

- 虚拟线程、平台线程和 carrier。
- thread-per-task 模型。
- 阻塞、资源容量、ThreadLocal 和可观测性。
- 为什么不使用虚拟线程池限制外部资源。
- Structured Concurrency、ScopedValue 按目标 JDK 的版本状态讲解。
- 代码：虚拟线程聚合服务、Semaphore 资源保护、与平台线程池对比。

验收：能够判断一个系统是否适合迁移到虚拟线程。

### 第四阶段：生产能力与综合实战

#### 第 14 课：并发设计模式与可靠性

- 不可变对象、线程封闭、Guarded Suspension。
- 生产消费、两阶段终止、Memoizer、分段锁。
- deadline、取消传播、背压、资源隔离和降级。
- 死锁、活锁、饥饿、线程泄漏的设计预防。
- 代码：有界并发聚合器和缓存设计。

验收：完成一份包含容量、失败和关闭策略的并发设计。

#### 第 15 课：并发测试、诊断与性能

- 使用屏障和锁存器构造可重复测试。
- jcstress 与线性一致性基础。
- JMH 的预热、死代码消除和错误基准。
- jcmd、jstack、JFR。
- 线程池活跃数、队列长度、等待时间和拒绝数。
- 代码：死锁、CPU 空转、任务堆积、锁竞争四类故障实验。

验收：根据线程 dump 和监控数据给出故障根因及修复方案。

#### 第 16 课：综合项目与面试答辩

综合项目为“高并发多下游聚合服务”，要求：

- 并行调用多个模拟下游。
- 总 deadline 与单任务 timeout。
- 有界并发和背压。
- 取消传播、异常聚合、部分结果和降级。
- 平台线程池与虚拟线程两个版本。
- 优雅关闭和运行指标。
- 并发测试、压力测试和 JFR 分析。

最终验收：

1. 运行并讲解完整项目。
2. 解释关键并发选择及替代方案。
3. 完成一次源码问答。
4. 完成一次生产事故分析。
5. 完成一次模拟面试。

## 5. 建议的项目结构

仓库采用以下结构：

```text
jucLearn/
├── pom.xml
├── README.md
├── COURSE_PLAN.md
├── docs/
│   ├── lesson-01/
│   ├── lesson-02/
│   └── ...
├── src/
│   ├── main/java/com/caesaemc/juc/
│   │   ├── lesson01/
│   │   ├── lesson02/
│   │   └── ...
│   └── test/java/com/caesaemc/juc/
│       ├── lesson01/
│       ├── lesson02/
│       └── ...
├── benchmarks/
└── jcstress/
```

## 6. 推进规则

1. 全部课程材料已创建；学习时一次只打开当前课的文档、代码和测试。
2. 学习者先运行错误示例，记录现象和判断。
3. 再学习原理并完成 Exercise。
4. 共同评审代码、测试和面试答案。
5. 达到本课完成标准后，再进入下一课。
6. 每 4 课进行一次阶段复盘，不额外增加新知识。

## 7. 精简边界

以下内容不单独开课：

- Phaser、Exchanger、StampedLock：放入同步器选型课。
- Flow API：放入异步模型扩展阅读。
- Unsafe：只在源码阅读时解释。
- 所有并发容器的逐行源码：只精读 ConcurrentHashMap。
- JVM 锁实现的历史细节：只保留对当前代码和面试有价值的版本差异。
- 分布式锁、消息队列、响应式框架：不属于本轮 JUC 主线。

核心源码只精读四条：

1. AQS → ReentrantLock。
2. ConcurrentHashMap。
3. ThreadPoolExecutor → FutureTask。
4. CompletableFuture。

## 8. 已确认的课程设计

1. 课程规模为 8 周 16 课，可根据个人时间调整节奏。
2. JDK 21 是课程主版本。
3. 第 16 课保留完整综合项目，并复用前面课程形成的构件。
4. 授课顺序采用“错误实验 → 原理 → 正确实现 → 测试 → 面试复盘”。
5. Exercise 保留 TODO 和禁用测试，学习到对应课程后再实现与评审。
