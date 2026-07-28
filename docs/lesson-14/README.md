# 第 14 课：并发设计模式与可靠性

## 学习目标

1. 从“共享状态、所有权、生命周期”三个维度设计并发组件。
2. 掌握 Memoizer、Guarded Suspension、两阶段终止和 Bulkhead。
3. 区分 timeout 与 deadline，并让一组调用共享时间预算。
4. 把容量、取消、降级和关闭策略写进接口，而不是留给调用者猜。
5. 能评审并发设计中的死锁、饥饿、泄漏和缓存击穿风险。

## 1. 先减少共享，再选择同步

并发设计的优先顺序：

```text
不可变值
  ↓ 仍需变化
线程封闭 / 消息传递
  ↓ 必须共享
线程安全容器或原子复合操作
  ↓ 需要维护多变量不变式
显式锁
```

- 不可变对象把状态一次性安全发布，之后无需同步。
- 线程封闭让可变状态只有一个所有者。
- `BlockingQueue` 同时承担传递、等待和背压。
- 锁只保护明确的不变式，临界区内避免未知 I/O。

## 2. 常用模式是一组生命周期协议

| 模式 | 解决的问题 | JUC 构件 | 必须说明的边界 |
|---|---|---|---|
| Guarded Suspension | 条件未满足时等待 | `Condition` / `wait` | 循环检查条件、中断、超时 |
| Producer–Consumer | 生产与处理解耦 | 有界 `BlockingQueue` | 容量、满载策略、关闭信号 |
| Two-Phase Termination | 先请求停止，再清理 | 中断 + 状态 | 谁发起、等待多久、强制阶段 |
| Memoizer | 相同计算共享结果 | `ConcurrentHashMap<K, Future<V>>` | 失败/取消是否缓存、失效策略 |
| Bulkhead | 故障和容量隔离 | 独立池 / `Semaphore` | 获取许可超时、降级、指标 |
| Striping | 降低单锁竞争 | 分段锁 / `LongAdder` | 跨分段一致性、热点 key |

模式不是一个类名。每个模式都必须把正常完成、失败、超时、取消和关闭五条路径讲完整。

## 3. Memoizer：缓存正在进行的计算

只缓存最终值不能阻止并发缓存击穿。`Memoizer` 缓存 `Future<V>`：

1. 第一个线程用 `putIfAbsent` 放入 `FutureTask`。
2. 只有赢得竞争的线程执行 loader。
3. 其他线程等待同一个 Future。
4. 失败或取消时删除对应 Future，使下一次调用可以重试。

loader 必须允许重复执行，因为失败后的重试、失效和进程重启都可能再次调用它。

## 4. timeout 不等于 deadline

如果三个串行步骤都使用“超时 100 ms”，总耗时可能接近 300 ms。生产请求通常需要一个绝对 deadline：

```text
入口记录 deadline = 单调时钟当前值 + 总预算
每一步 timeout = min(该步骤上限, deadline - 当前值)
剩余时间 <= 0 时不再启动新工作
```

`DeadlineBudget` 使用 `System.nanoTime()`，因为它适合测量经过时间，不受墙上时钟校准影响。

## 5. 有界并发聚合器

`BoundedAggregator` 组合了前面课程的能力：

- 每个调用由虚拟线程承载。
- `Semaphore` 独立表达外部资源容量。
- 所有调用共享同一个 `DeadlineBudget`。
- 超时时取消 Future，中断传递到合作式任务。
- 每个下游保留成功、失败或超时结果，实现部分降级。
- 输出顺序与输入顺序一致，方便上层建立稳定协议。

这里的 Semaphore 是 Bulkhead，不是吞吐调优旋钮。容量应来自数据库连接数、下游额度和压测数据。

## 6. 可靠性评审清单

- 状态：哪些值共享？哪些不变式必须原子维护？
- 所有权：谁创建、更新、关闭执行器和队列？
- 容量：线程、队列、许可、内存分别有多大上限？
- 时间：总 deadline 与单步 timeout 如何传递？
- 失败：是否区分失败、超时、拒绝和取消？
- 取消：阻塞调用是否响应中断？底层客户端能否取消？
- 背压：满载时拒绝、阻塞、调用者执行还是降级？
- 死锁：锁顺序是否固定？是否持锁调用外部代码？
- 指标：活跃数、等待数、超时数、拒绝数是否可见？
- 关闭：停止接收、等待排空、强制中断各多久？

## 7. 代码导航

- `DeadlineBudget`：共享绝对时间预算。
- `Memoizer`：同 key 单飞计算与失败重试。
- `BoundedAggregator`：有界资源、多结果、取消传播。
- `BulkheadExercise`：动手完成限时许可和降级。

## 8. 运行

```bash
mvn -Dtest=Lesson14Test test
java -cp target/classes com.caesaemc.juc.lesson14.Lesson14Application
```

## 9. 完成标准

- [ ] 能说明为什么 Memoizer 缓存 Future 而不是值。
- [ ] 能区分 timeout、deadline、取消和拒绝。
- [ ] 能给出一份包含容量与关闭策略的并发设计。
- [ ] 能证明许可在所有异常路径都会释放。
- [ ] 完成 `BulkheadExercise`。

## 官方参考

- [ConcurrentHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)
- [FutureTask](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/FutureTask.html)
- [Semaphore](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html)
