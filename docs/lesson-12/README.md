# 第 12 课：ForkJoinPool 与任务模型选型

## 交互式学习入口

[打开第 12 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=12)

网页包含本课 TODO、fork/compute/join 与工作窃取流程、任务队列数据分布、真实源码行号、练习和面试验收。

## 学习目标

1. 理解工作窃取和分治任务。
2. 写出正确 fork/compute/join 模式。
3. 理解阻塞对 ForkJoin worker 的影响。
4. 识别 parallelStream 的公共线程池风险。
5. 在平台线程池、CF、ForkJoin、虚拟线程之间选型。

## 1. 工作窃取

ForkJoinPool 为 worker 维护双端任务队列。工作线程优先处理自己的任务，空闲时从其他 worker 窃取，降低统一队列竞争。

适合：

- 任务可递归拆分。
- 子任务规模相近。
- CPU 计算为主。
- 合并成本较低。

不适合直接套用：

- 大量长时间阻塞。
- 子任务极度不均。
- 任务太小，调度成本高于计算。

## 2. fork/compute/join

`ParallelSumTask` 使用：

```text
拆为 left/right
left.fork()
当前线程直接 compute right
left.join()
合并
```

直接计算一个分支可以减少不必要的入队和等待。

阈值需要通过数据规模和基准测量确定，不能机械固定。

## 3. 阻塞与 ManagedBlocker

ForkJoinPool 默认根据计算并行度管理 worker。大量阻塞会让可运行 worker 不足。

对于无法避免的阻塞，可使用 `ForkJoinPool.managedBlock` 告知池进行补偿评估。它不是把任意 I/O 自动变快，也不能替代超时和资源限流。

`ManagedBlockerDemo` 展示接口协议：

- `isReleasable` 非阻塞判断。
- `block` 执行阻塞直到可释放。

## 4. parallelStream 风险

默认并行流通常使用 commonPool：

- 应用中不同组件共享。
- 阻塞操作可能拖慢无关任务。
- 嵌套并行和线程上下文难以推理。
- 小集合可能比顺序流更慢。

使用前必须测量数据量、每元素成本、拆分能力和部署 CPU 配额。

## 5. 任务模型选择

| 任务 | 候选模型 |
|---|---|
| 递归 CPU 分治 | ForkJoin |
| 多阶段异步依赖 | CompletableFuture |
| 稳定数量的平台线程任务 | ThreadPoolExecutor |
| 大量独立阻塞任务 | 虚拟线程 |

选型还要考虑取消、超时、隔离、可观测性和下游容量。`TaskModelSelector` 是教学模型，不是自动调参器。

## 6. Flow API 扩展

`java.util.concurrent.Flow` 定义 Publisher、Subscriber、Subscription、Processor，核心是订阅者通过 `request(n)` 表达需求。

它只是响应式流接口，不自动提供线程模型、持久化和错误重试。只有业务确实需要流式背压时再引入完整实现。

## 7. 代码导航

- `ParallelSumTask`
- `ManagedBlockerDemo`
- `TaskModelSelector`
- `MaxTaskExercise`

## 8. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson12.Lesson12Application
```

## 9. 完成标准

- [ ] 能解释工作窃取。
- [ ] 能写 fork/compute/join。
- [ ] 能解释阈值的作用。
- [ ] 能说明 commonPool 风险。
- [ ] 能为四类任务选型。
- [ ] 完成 `MaxTaskExercise`。

## 官方参考

- [ForkJoinPool](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)
- [Flow](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Flow.html)
