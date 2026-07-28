# 第 06 课：同步工具与并发故障

## 学习目标

1. 按生命周期选择 CountDownLatch、CyclicBarrier、Semaphore。
2. 理解 ReadWriteLock 与 StampedLock 的适用边界。
3. 识别死锁、活锁、饥饿和锁竞争。
4. 使用 ThreadMXBean 或线程 dump 发现死锁。
5. 确保许可、锁等资源在异常路径中归还。

## 1. 同步工具选型

### CountDownLatch

- 一次性。
- 一个或多个线程等待计数归零。
- 常用于等待服务初始化、同时起跑或等待一组任务完成。
- 归零后不能重置。

`SynchronizerShowcase.startTogether` 使用 ready、start、done 三个门闩，让实验时序可控。

### CyclicBarrier

- 固定数量的参与者互相等待。
- 所有人到齐后进入下一代，可重复使用。
- 任一等待者中断、超时或 barrier action 失败，屏障可能 broken。

### Semaphore

- 表示有限许可，不表示任务线程数量。
- 适合限制数据库连接、外部接口并发、内存缓冲区等稀缺资源。
- 成功 acquire 后必须在 finally 中 release。
- 公平模式降低插队，通常付出吞吐代价。

`ResourceGate` 记录实际并发数并保证异常时归还许可。

## 2. 读写锁

ReentrantReadWriteLock 适合：

- 读远多于写。
- 临界区不是极短操作。
- 读取可以并行，写入必须独占。

不一定适合：

- 写入频繁。
- 临界区极短，管理成本超过收益。
- 读取后经常需要升级为写锁。

锁降级可以在持有写锁时先获取读锁再释放写锁；直接从读锁升级为写锁容易死锁。

## 3. StampedLock

StampedLock 支持写锁、读锁和乐观读。乐观读步骤：

```text
获取 stamp
读取普通字段到局部变量
validate
失败则退化到悲观读锁并重读
```

`StampedPoint` 展示这一模式。

重要边界：

- 不可重入。
- stamp 必须配对释放。
- 乐观读只适合能安全复制到局部变量的状态。
- validate 失败后必须重读，不能继续使用旧局部值。

## 4. 四类并发故障

### 死锁

线程形成循环等待。经典必要条件：互斥、占有且等待、不可抢占、循环等待。

预防方法：

- 全局锁顺序。
- 减少同时持有多把锁。
- 使用带超时 `tryLock`。
- 避免在持锁期间调用未知外部代码。

### 活锁

线程持续运行和改变状态，却互相礼让或重试而没有进展。可加入随机退避或明确仲裁。

### 饥饿

某些线程长期得不到资源。原因可能包括非公平竞争、任务优先级、长临界区和线程池隔离不足。

### 锁竞争

系统仍有进展，但大量时间花在等待锁、上下文切换和缓存一致性上。需通过 JFR、线程 dump 和指标定位。

## 5. 死锁实验

`DeadlockLab` 创建两个 daemon 线程，让它们按照相反顺序获取监视器，再使用：

```java
ManagementFactory.getThreadMXBean().findDeadlockedThreads()
```

实际排障还可以使用：

```bash
jcmd <pid> Thread.print -l
jstack -l <pid>
```

不要把真实死锁实验嵌入长期运行的生产 JVM。

## 6. 代码导航

- `ResourceGate`
- `SynchronizerShowcase`
- `StampedPoint`
- `DeadlockLab`
- `PermitGuardExercise`

## 7. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson06.Lesson06Application
```

## 8. 完成标准

- [ ] 能比较 Latch、Barrier、Semaphore。
- [ ] 能写出许可的 finally 归还。
- [ ] 能写出 StampedLock 乐观读模板。
- [ ] 能列出死锁四个条件。
- [ ] 能给出至少三种死锁预防方式。
- [ ] 完成 `PermitGuardExercise`。

## 官方参考

- [java.util.concurrent API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [StampedLock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/StampedLock.html)
