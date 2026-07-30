# 第 03 课：线程协作、CAS、锁与同步器

> 状态：未开始
>
> 建议用时：2 × 75 分钟
>
> 学习页面：[打开第 03 课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=03)

这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。本课使用独立的
`course03` 主源码串起一条主线：线程收到停止请求，竞争共享状态，失败后
进入等待队列，条件满足后再被唤醒。

## Todo

- [ ] 读完本课讲义并记住工具选择顺序
- [ ] 播放 AQS 动画并解释 `state`、`owner`、`head`、`tail`
- [ ] 阅读并运行中断、CAS、AQS 和 Semaphore 源码
- [ ] 重写 `Course03Exercise` 并通过测试
- [ ] 不看答案口述三道面试题

## 正确学习路径

1. 先学中断：理解“请求停止”而不是“强制杀死”。
2. 再学 CAS：理解一个共享值如何在无锁条件下原子更新。
3. 再学 AQS：理解 CAS 失败的线程为什么需要入队、阻塞和唤醒。
4. 再学 Condition：理解等待业务条件与等待锁是两条不同队列。
5. 最后学习 Semaphore、CountDownLatch 等同步器的选型。

不要一开始背 AQS 源码细节。先能画出状态、队列和线程迁移，再阅读实现。

## 只记三句话

1. `interrupt()` 发送的是协作式取消信号，任务必须在安全点检查并收尾。
2. CAS 只有在观察值未变化时才更新；失败后必须重新读取并重新计算。
3. AQS 管理同步状态、等待队列、阻塞和唤醒，子类只定义获取与释放条件。

工具选择口诀：

```text
停止一个任务                         → interrupt + 任务主动退出
一个共享值的短更新                   → Atomic 类或 CAS 循环
保护多个字段和复合不变量             → Lock / synchronized
等待“非空、非满”等业务条件           → Condition
限制同时访问下游的数量               → Semaphore
等待一组一次性任务完成               → CountDownLatch
```

## 中断与取消

线程的中断标志是一条状态信息。`interrupt()` 不会跳到目标线程里执行退出
逻辑，也不会自动释放目标线程持有的业务资源。

任务通常在三类位置响应中断：

- 循环条件中调用 `isInterrupted()`。
- 阻塞方法抛出 `InterruptedException`。
- 业务安全点显式检查，并在退出前完成清理。

`sleep`、`wait`、`join`、`BlockingQueue.take` 等方法抛出
`InterruptedException` 时会清除中断标志。如果当前方法不能把异常继续
抛给上层，应恢复中断状态并尽快结束当前工作：

```java
try {
    queue.take();
} catch (InterruptedException exception) {
    Thread.currentThread().interrupt();
    return;
}
```

空的 `catch (InterruptedException ignored)` 会吞掉取消协议，是面试和
生产代码中的高频错误。

## CAS 与原子更新

CAS 可以理解为：

```text
如果共享值仍等于 expected
    就把它更新为 update，并返回成功
否则
    不修改共享值，并返回失败
```

项目中的 `VarHandleCounter` 使用标准 CAS 重试循环：

```java
int observed;
do {
    observed = (int) VALUE.getVolatile(this);
} while (!VALUE.compareAndSet(this, observed, observed + 1));
```

每次失败都必须重新读取 `observed`，因为失败已经证明共享状态发生变化。
成功的 CAS 是这次递增操作的线性化点。

CAS 适合状态较小、临界区很短的更新。复杂业务规则、高竞争或需要等待
条件时，持续重试可能浪费 CPU，锁通常更容易保证整体不变量。

ABA 指值经历了 `A → B → A`。只比较当前值时无法发现中间变化；业务若
关心版本，应把版本号一起比较，例如使用 `AtomicStampedReference`。

## AQS 与等待队列

本课动画使用项目中的不可重入 `Mutex`。它把 AQS 的 `state` 定义为：

```text
state = 0  → 锁空闲
state = 1  → 锁已被 exclusiveOwnerThread 持有
```

一次典型的独占获取流程：

1. Thread A 执行 `CAS(0, 1)` 成功，成为 owner。
2. Thread B 执行同一个 CAS 失败。
3. AQS 为 B 创建等待节点并追加到同步队列。
4. B 被 `park`，停止持续空转。
5. A 清除 owner，并把 `state` 写回 0。
6. AQS `unpark` 有效后继 B。
7. B 醒来后重新竞争，成功后成为新 owner。

`unpark` 不等于直接把锁交给 B。它只让 B 重新具备运行资格，B 仍要执行
获取协议。非公平锁允许新到线程在这一时刻参与竞争；公平锁会更严格地
检查队列前驱，但吞吐通常更低。

## Condition 与同步器

锁的同步队列保存“暂时拿不到锁”的线程。Condition 队列保存“已经拿到锁，
但业务条件不满足”的线程。

`await()` 的关键动作：

1. 当前线程必须先持有关联的 Lock。
2. 线程进入对应 Condition 队列。
3. 完全释放锁，让修改条件的线程进入。
4. 被 `signal()` 后转移到同步队列。
5. 重新获得锁后，`await()` 才返回。

因此条件检查必须放在 `while` 中：

```java
lock.lockInterruptibly();
try {
    while (count == 0) {
        notEmpty.await();
    }
    // 条件成立，并且当前仍持锁
} finally {
    lock.unlock();
}
```

常用同步器的本质都是“状态 + 等待协议”：

- `CountDownLatch`：状态递减到 0 后永久打开。
- `Semaphore`：状态表示剩余许可，可多线程同时通过。
- `CyclicBarrier`：一组线程分代到齐后一起继续。
- `ReentrantReadWriteLock`：读共享、写独占。
- `StampedLock`：提供写锁、悲观读和需要校验的乐观读。

## 动画阅读方法

播放网页中的七步 AQS 动画时，每一步只回答四个问题：

1. `state` 当前是 0 还是 1？
2. `exclusiveOwnerThread` 指向谁？
3. Thread B 在运行、竞争、等待，还是已经持锁？
4. 本步移动的是 CAS、等待节点，还是 `unpark` 信号？

图中的队列只展示逻辑获取方向，省略双向链接和不同 JDK 版本的内部状态位。

## 源码学习顺序

1. [TwoPhaseTerminator.java](../../src/main/java/com/caesaemc/juc/course03/TwoPhaseTerminator.java)：中断请求、恢复标志、`finally` 收尾和 `join` 验收。
2. [CasCounter.java](../../src/main/java/com/caesaemc/juc/course03/CasCounter.java)：CAS 失败后重新读取。
3. [AqsMutex.java](../../src/main/java/com/caesaemc/juc/course03/AqsMutex.java)：AQS 独占获取、等待和释放条件。
4. [ResourceGate.java](../../src/main/java/com/caesaemc/juc/course03/ResourceGate.java)：Semaphore 许可和异常路径释放。
5. [Course03Exercise.java](../../src/main/java/com/caesaemc/juc/course03/Course03Exercise.java)：中断异常后的恢复与退出。

本课唯一运行入口：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.course03.Course03Application
```

## 一个练习

目标：让可取消任务在收到中断后可靠停止，不吞掉取消信号。

修改
[Course03Exercise.java](../../src/main/java/com/caesaemc/juc/course03/Course03Exercise.java)，
在捕获 `InterruptedException` 后恢复中断标志并退出循环。

```bash
mvn -q -Dtest=Course03ExerciseTest test
```

完成后必须能解释：为什么阻塞方法抛出 `InterruptedException` 后需要恢复
标志，以及为什么不能继续无限循环。

## 三道面试题

### 1. interrupt 为什么不是强制停止线程？

它只修改中断状态或让可中断阻塞抛出异常。任务何时检查、怎样释放资源和
何时退出，仍由任务代码决定。

### 2. CAS 失败后为什么不能直接再次写入原来的新值？

失败说明 expected 已过期。必须重新读取最新状态，再根据最新状态计算
新值，否则会覆盖其他线程已经完成的更新。

### 3. AQS 主要帮同步器解决什么问题？

它统一管理同步状态、同步队列、线程阻塞、唤醒、中断和取消；同步器子类
只需要定义什么情况下获取或释放成功。

## 学习记录

### 2026-07-30：建立第三课独立源码

- `course03` 统一承载“中断 → CAS → AQS → Semaphore”的学习主线。
- 网页动画选择 `Mutex` 的一次真实锁交接作为中心模型。
- 下一步：先运行 `TwoPhaseTerminator`，再播放 AQS 动画。

## 有价值问答

- 问题：
- 当时怎么想：
- 正确结论：
- 代码或实验依据：
- 一句话面试回答：

## 课后复盘

- 我已经掌握：
- 我仍然容易混淆：
- 我能否手画 AQS 状态和等待队列：
- 一周后需要重新回答的问题：
