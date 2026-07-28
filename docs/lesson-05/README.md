# 第 05 课：AQS、ReentrantLock 与 Condition

## 学习目标

1. 理解 AQS 的 state、模板方法和等待队列。
2. 解释独占获取、阻塞、唤醒、取消的主流程。
3. 区分公平锁和非公平锁。
4. 正确使用 Condition 的等待与通知。
5. 能阅读一个最小 AQS 同步器。

## 1. AQS 的职责

AbstractQueuedSynchronizer 把同步器拆成两部分：

- 子类定义“什么状态表示成功”，实现 `tryAcquire/tryRelease` 或共享版本。
- AQS 处理失败线程的入队、park、唤醒、中断和取消。

核心字段 `state` 的含义由子类决定：

- 互斥锁：0 表示空闲，1 或更大表示持有/重入次数。
- CountDownLatch：剩余计数。
- Semaphore：剩余许可。

## 2. 独占获取主流程

简化流程：

```text
调用 acquire
→ 子类 tryAcquire
→ 成功：进入临界区
→ 失败：创建节点并进入同步队列
→ 检查前驱，必要时 park
→ 前驱释放后被唤醒
→ 再次 tryAcquire
→ 成功后成为队列头部
```

线程被唤醒不等于已经获得锁，它必须重新竞争。

## 3. 释放主流程

```text
调用 release
→ 子类 tryRelease
→ 状态达到完全释放
→ 唤醒队列中的合适后继
```

`Mutex` 是一个不可重入教学锁：

- CAS 0→1 成功即获得锁。
- 记录持有线程。
- 只有持有线程能把状态恢复为 0。
- AQS 负责其余排队过程。

生产代码优先使用 JDK 已提供的锁。

## 4. 公平与非公平

- 公平锁倾向让等待时间最长的线程先获得，降低插队。
- 非公平锁允许新线程直接竞争，通常吞吐更高。
- 公平不等于操作系统级绝对顺序，也不消除线程调度差异。

只有业务明确要求等待顺序或需要降低长期饥饿风险时才优先公平锁。

## 5. Condition

Condition 是与 Lock 绑定的条件等待队列。

等待过程：

```text
持锁线程调用 await
→ 进入条件队列
→ 完全释放锁
→ 被 signal、interrupt 或超时唤醒
→ 转移到同步队列
→ 重新获得锁
→ await 返回或抛异常
```

`signal()` 不会让等待线程立即执行，只负责把节点转移到重新竞争锁的路径。

等待仍必须用 while：

```java
while (count == 0) {
    notEmpty.await();
}
```

`BoundedBuffer` 使用 `notEmpty` 和 `notFull` 两个条件，避免无关等待者全部参与竞争。

## 6. 中断与超时

ReentrantLock 支持：

- `lock()`：普通获取。
- `lockInterruptibly()`：等待锁期间响应中断。
- `tryLock()`：立即尝试。
- `tryLock(timeout, unit)`：带总超时尝试。

无论哪种路径，成功获得锁后都必须在 finally 中释放。

## 7. 代码导航

- `Mutex`：AQS 独占模式最小实现。
- `BoundedBuffer`：ReentrantLock 与两个 Condition。
- `OneShotLatchExercise`：AQS 共享模式练习。

## 8. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson05.Lesson05Application
```

## 9. 完成标准

- [ ] 能画出 acquire/release 主流程。
- [ ] 能解释 state 由谁定义。
- [ ] 能说明唤醒与获得锁的区别。
- [ ] 能解释 Condition 队列如何回到同步队列。
- [ ] 能比较公平和非公平。
- [ ] 完成 `OneShotLatchExercise`。

## 官方参考

- [AbstractQueuedSynchronizer](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html)
- [ReentrantLock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [Condition](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Condition.html)
