# 第 06 课面试复盘

## CountDownLatch 与 CyclicBarrier 的区别？

Latch 等待计数归零且不可重置；Barrier 让固定参与者互相等待并可循环使用。

## Semaphore 能替代线程池吗？

不能完全替代。Semaphore 限制资源并发，线程池同时负责线程复用、任务排队、生命周期和拒绝策略。虚拟线程场景常用 Semaphore 单独限制外部资源。

## StampedLock 乐观读为什么要 validate？

读字段期间可能有写锁成功获取。validate 验证 stamp 后是否发生写入，失败必须在读锁下重读。

## 什么是死锁？

多个线程持有一部分资源并循环等待对方资源，且无法被抢占，导致永久无进展。

## 如何定位死锁？

查看线程 dump 中互相等待的锁、持有者和堆栈；使用 `jcmd Thread.print -l`、`jstack -l` 或 ThreadMXBean。

## 场景题

数据库连接池只有 20 个连接，但服务线程池有 200 个线程。大量线程阻塞在取连接：

- 用连接池自身上限或 Semaphore 表达资源容量。
- 设置获取超时和整体 deadline。
- 监控许可等待时间，而不只是活跃线程数。
- 避免持有业务锁时等待连接。
