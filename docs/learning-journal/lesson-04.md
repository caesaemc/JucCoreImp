# 第 04 课：并发集合、队列与生产消费

> 状态：未开始
>
> 建议用时：90 分钟
>
> 学习页面：[打开第 04 课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=04)

这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。独立的
`course04` 主源码组成一条数据通道：先用并发容器原子建立数据，再通过有界队列把数据
安全交给消费者，并在过载时把压力传回生产者。

## Todo

- [ ] 读完本课讲义并区分单次安全与复合安全
- [ ] 播放容器动画并解释 Map bin、队列槽位和两个索引
- [ ] 阅读并运行 ConcurrentHashMap 与 BlockingQueue 源码
- [ ] 重写 `Course04Exercise` 并通过测试
- [ ] 不看答案口述三道面试题

## 正确学习路径

1. 先判断业务动作是一次容器调用，还是多个调用组成的复合动作。
2. 再学习 `computeIfAbsent`、`compute`、`merge` 等容器原子协议。
3. 再学习 BlockingQueue 的容量、阻塞语义和停止协议。
4. 最后把 Map 和 Queue 组合成有边界的生产消费流水线。

## 只记三句话

1. `ConcurrentHashMap` 的单次方法线程安全，不代表 `containsKey + put` 整体原子。
2. 有界队列把过载变成明确的等待、超时或拒绝，无界队列把问题推迟成内存和延迟风险。
3. 消费者必须有结束协议，不能在生产结束后永远阻塞在 `take()`。

选择口诀：

```text
同 key 缺失时建立一次值             → computeIfAbsent
同 key 基于旧值更新                 → compute / merge
固定容量 FIFO 数据通道              → ArrayBlockingQueue
生产者与消费者必须直接配对           → SynchronousQueue
延迟到期后才能消费                   → DelayQueue
读多写极少的小快照集合               → CopyOnWriteArrayList
```

## 并发 Map 的复合动作

下面两次调用各自安全，但组合不安全：

```java
if (!map.containsKey(key)) {
    map.put(key, load(key));
}
```

两个线程可以同时通过检查，各自执行一次昂贵加载，最后一个 `put` 再覆盖
前一个结果。正确方向是让容器协议表达“缺失时建立”：

```java
V value = map.computeIfAbsent(key, loader);
```

这保证同一个 key 的映射建立过程由容器协调，但不意味着映射函数可以任意
执行复杂工作。映射函数应避免：

- 递归修改同一个 key。
- 长时间阻塞其他线程需要的计算。
- 难以重试或无法接受重复的外部副作用。

远程慢加载通常需要进一步存储 `Future<V>`，把“正在进行的计算”也作为
缓存值，并为失败、超时和失效建立明确协议。

## ConcurrentHashMap 的理解边界

面试不需要背某个 JDK 版本的全部私有字段，但需要理解以下稳定主线：

- 数据存储在 table 的 bin 中。
- 空 bin 可以通过 CAS 安装节点。
- 冲突 bin 的更新需要更细粒度协调。
- 冲突较高时 bin 可能树化，但阈值属于实现细节。
- 扩容可以由多个线程协助迁移。
- 遍历是弱一致的，不承诺全局瞬时快照。

“弱一致”不是线程不安全。它表示遍历期间允许并发更新，迭代器不会像
普通 `HashMap` 那样依赖 fail-fast 来表达并发语义。

## BlockingQueue 与背压

BlockingQueue 同时表达两件事：

1. 数据从生产者移交给消费者。
2. 容量不足或数据不足时，线程应该怎样等待。

常用方法语义：

```text
add / remove / element       → 失败时抛异常
offer / poll / peek          → 立即返回特殊值
put / take                   → 一直等待
offer(timeout) / poll(timeout) → 限时等待
```

生产系统更偏向有界队列，因为容量上限能回答：

- 最多允许多少条数据占用内存？
- 队满后生产者阻塞、超时、丢弃还是降级？
- 允许的排队延迟是多少？
- 监控何时应该告警？

无界队列并没有消除过载，只是让过载首先表现为队列增长和尾延迟上升。

## 环形数组与条件队列

网页动画使用容量为 3 的 `ArrayBlockingQueue`。核心状态包括：

```text
items[]    保存数据
putIndex   下一次写入位置
takeIndex  下一次读取位置
count      当前元素数量
notFull    队满时生产者等待
notEmpty   队空时消费者等待
```

索引到达数组尾部后回到 0，因此物理槽位顺序不总是等于逻辑 FIFO 顺序。
`count` 负责区分“索引相等但队列为空”和“索引相等但队列已满”。

队满时，`put` 在 `notFull` 上等待；消费者 `take` 清空一个槽位并
`signal notFull`。被通知的生产者仍要重新获得内部锁并再次检查条件。

## 停止协议与批处理

消费者不能根据“暂时取不到数据”判断生产已经结束。常见停止方式：

- poison pill：生产者放入约定的结束消息。
- 关闭外部生命周期并中断消费者。
- 使用显式 channel 状态表达 close。

poison pill 的数量通常至少要覆盖消费者数量，否则可能仍有消费者永远
等待。结束消息不能与合法业务数据混淆。

批处理可使用 `drainTo` 减少锁竞争和下游调用次数，但必须同时约束：

- 最大批量，避免单批占用过多内存。
- 最大等待时间，避免低流量时迟迟不发送。
- 失败后的重试、拆批和幂等规则。

## 动画阅读方法

播放网页中的七步动画，依次观察：

1. Map 和容量为 3 的 Queue 在堆中创建。
2. producer 用 `computeIfAbsent(42, loader)` 建立映射。
3. `42 → Profile-A` 进入目标 bin。
4. J1 写入 `items[0]`，`putIndex` 前进。
5. J1、J2、J3 填满队列，J4 的生产者等待 `notFull`。
6. consumer 取出 J1，`takeIndex` 前进并通知 `notFull`。
7. producer 重新竞争成功，把 J4 写进循环复用的槽位 0。

每一步同时核对 `items[]`、`putIndex`、`takeIndex`、`count` 和线程状态。

## 源码学习顺序

1. [CompoundActionLab.java](../../src/main/java/com/caesaemc/juc/course04/CompoundActionLab.java)：稳定复现 `containsKey + put` 复合竞态。
2. [AtomicCache.java](../../src/main/java/com/caesaemc/juc/course04/AtomicCache.java)：使用 `computeIfAbsent`。
3. [BoundedPipeline.java](../../src/main/java/com/caesaemc/juc/course04/BoundedPipeline.java)：有界队列、消费者和结束信号。
4. [QueueSemanticsLab.java](../../src/main/java/com/caesaemc/juc/course04/QueueSemanticsLab.java)：直接移交队列语义。
5. [Course04Exercise.java](../../src/main/java/com/caesaemc/juc/course04/Course04Exercise.java)：同 key 原子加载练习。

运行本课：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.course04.Course04Application
```

## 一个练习

目标：让同一个 key 在并发访问时只执行一次加载。

修改
[Course04Exercise.java](../../src/main/java/com/caesaemc/juc/course04/Course04Exercise.java)，
把 `get + load + put` 改为容器提供的原子复合操作。

```bash
mvn -q -Dtest=Course04ExerciseTest test
```

完成后说明映射函数为什么不能递归更新同一个 key，以及慢远程调用为什么
还需要 Future、超时和失败清理。

## 三道面试题

### 1. ConcurrentHashMap 的 put 安全，为什么 containsKey + put 不安全？

因为两个方法之间存在可被其他线程插入的时间窗口。单次方法的线程安全
不能自动扩展到多个方法组成的业务事务。

### 2. 为什么生产环境通常选择有界队列？

有界队列能把容量和满载策略显式化，避免任务无限占用内存，并让过载及时
表现为阻塞、超时或拒绝。

### 3. ArrayBlockingQueue 和 SynchronousQueue 的核心区别是什么？

前者有固定数组容量，可以暂存有限元素；后者容量为 0，每次移交都要求
生产者和消费者直接配对。

## 学习记录

### 2026-07-30：建立第四课独立源码

- `course04` 统一承载“原子容器操作 → 有界数据通道 → 背压与停止协议”。
- 网页动画同时展示 CHM 映射和 ArrayBlockingQueue 环形数组状态。
- 下一步：先预测 `CompoundActionLab` 的加载次数，再运行验证。

## 有价值问答

- 问题：
- 当时怎么想：
- 正确结论：
- 代码或实验依据：
- 一句话面试回答：

## 课后复盘

- 我已经掌握：
- 我仍然容易混淆：
- 我能否解释队满时线程去了哪里：
- 一周后需要重新回答的问题：
