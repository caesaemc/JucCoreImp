# 第 12 课面试复盘

## 什么是工作窃取？

每个 worker 维护本地任务队列，空闲 worker 从其他队列窃取任务，降低集中竞争并提高负载均衡。

## RecursiveTask 与 RecursiveAction？

RecursiveTask 有返回值，RecursiveAction 没有返回值。

## 为什么 fork 一个、直接 compute 一个？

当前 worker 可以继续做有用工作，减少两个分支都入队后再等待的额外调度。

## ForkJoinPool 适合阻塞任务吗？

主要面向计算任务。不可避免的阻塞可考虑 ManagedBlocker；大量普通阻塞更适合虚拟线程或隔离的平台线程池。

## parallelStream 为什么线上可能有问题？

默认共享 commonPool，阻塞和重任务可能影响其他组件；并行成本也可能高于收益。

## 场景题

并行流处理数据库查询后 commonPool 饥饿：

- 数据库查询是阻塞操作。
- 改为显式执行模型和独立资源限制。
- 可用虚拟线程每任务执行，并用连接池/Semaphore 限制数据库并发。
- 保留 timeout、取消和指标。
