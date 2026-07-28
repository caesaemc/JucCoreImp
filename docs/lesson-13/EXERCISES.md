# 第 13 课练习

## 必做：虚拟线程与资源限流

重新设计 `VirtualResourceExercise.invokeAll`：

- 使用 try-with-resources 关闭虚拟线程执行器。
- 每个调用提交到独立虚拟线程。
- 使用 Semaphore 限制实际资源并发。
- acquire 后在 finally 中 release。
- 收集结果并正确传播异常。

```bash
mvn -Dtest=VirtualResourceExerciseTest test
```

## 迁移评审

评估一个固定 200 线程的 HTTP 聚合服务迁移到虚拟线程：

- 任务是否主要阻塞？
- 下游允许多少并发？
- ThreadLocal 中存了什么？
- 是否在 synchronized 内做阻塞调用？
- 指标和线程 dump 如何调整？
- 超时、取消是否真正传播到底层客户端？

## 对比实验

分别用固定 20 平台线程和每任务虚拟线程运行 1,000 个 sleep 任务。记录吞吐仅作观察，不把单次 nanoTime 当正式基准。
