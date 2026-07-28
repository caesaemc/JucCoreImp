# 第 08 课：并发队列与生产消费

## 学习目标

1. 区分非阻塞队列和 BlockingQueue。
2. 根据容量、顺序、移交和时间语义选择实现。
3. 使用有界队列表达背压。
4. 正确设计生产消费系统的停止协议。
5. 避免空转轮询和无界内存增长。

## 1. Queue 与 BlockingQueue

非阻塞队列常用：

- `offer`：插入失败返回 false。
- `poll`：队列空返回 null。
- `peek`：查看头部。

BlockingQueue 额外提供：

| 行为 | 抛异常 | 特殊值 | 阻塞 | 超时 |
|---|---|---|---|---|
| 插入 | add | offer | put | offer(timeout) |
| 移除 | remove | poll | take | poll(timeout) |

业务必须明确需要哪种饱和语义。

## 2. 主要队列选型

### ArrayBlockingQueue

- 有界数组。
- 创建时确定容量。
- 可选公平模式。
- 内存更可预测。

### LinkedBlockingQueue

- 链表节点。
- 可指定容量；不指定时容量非常大。
- 生产消费锁分离有利于吞吐，但节点带来分配成本。

### SynchronousQueue

- 没有存储容量。
- 每次 put 必须直接匹配 take。
- 常用于直接移交和线程池快速扩容策略。

### LinkedTransferQueue

- 非阻塞队列能力加直接 transfer。
- 生产者可以等待元素被消费者接收。

### PriorityBlockingQueue

- 按优先级出队。
- 逻辑上无界，必须在系统其他位置控制生产速率。
- 同优先级不自动保证 FIFO。

### DelayQueue

- 元素必须实现 Delayed。
- 只有延迟到期的头元素能被取出。
- 适合本地延迟任务、超时管理等；不是持久化调度系统。

## 3. 背压

无界队列把过载转化为：

- 内存增长。
- 排队延迟增长。
- 过期任务仍占用资源。

有界队列让过载显式化：

- 生产者阻塞。
- offer 超时或失败。
- 上层拒绝、降级或丢弃。

`BoundedPipeline` 使用 ArrayBlockingQueue，让快速生产者在容量满时通过 put 等待消费者。

## 4. 停止协议

常见方式：

- 中断消费者。
- poison pill。
- 关闭标志加队列唤醒。
- 上层 ExecutorService 生命周期。

poison pill 数量通常要覆盖消费者数量，并保证它不会与合法业务消息混淆。错误处理必须防止消费者提前退出后生产者永久阻塞。

## 5. 批处理

避免：

```java
while (queue.isEmpty()) {
}
```

推荐：

```text
take 阻塞取得第一个
drainTo 非阻塞取得剩余批次
处理批次
```

`BatchingQueueExercise` 实现这个模式。

## 6. 代码导航

- `BoundedPipeline`
- `QueueSemanticsDemo`
- `BatchingQueueExercise`

## 7. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson08.Lesson08Application
```

## 8. 完成标准

- [ ] 能按容量和移交语义选择队列。
- [ ] 能比较 put、offer、offer(timeout)。
- [ ] 能解释无界队列的延迟和内存风险。
- [ ] 能设计消费者停止协议。
- [ ] 能实现 take + drainTo 批处理。

## 官方参考

- [BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html)
- [java.util.concurrent 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
