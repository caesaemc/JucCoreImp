# 第 01 课：并发问题与 Java 内存模型

## 1. 本课目标

完成本课后，你应该能够：

1. 区分并发、并行、竞态条件和数据竞争。
2. 从原子性、可见性、有序性三个角度分析共享状态。
3. 解释 `counter++` 为什么不是原子操作。
4. 使用 happens-before 判断跨线程写入是否保证可见。
5. 解释 `Thread.start()` 和 `Thread.join()` 不只是线程生命周期 API。
6. 理解为什么一次正确运行不能证明并发程序正确。

本课不会深入讲 `volatile`、`synchronized` 的实现细节，它们是第二课的主题。本课只把它们作为建立正确内存关系的对照手段。

## 2. 推荐学习顺序

1. 先运行 `DeterministicLostUpdateDemo`。
2. 阅读 `UnsafeCounter`，把 `value++` 拆成三个逻辑步骤。
3. 运行 `CounterRaceDemo`，记录每轮结果。
4. 阅读本讲义的 Java 内存模型与 happens-before 部分。
5. 运行 `HappensBeforeDemo`。
6. 分别运行 `VisibilityDemo plain` 和 `VisibilityDemo volatile`。
7. 完成 `EXERCISES.md`。
8. 使用 `INTERVIEW.md` 做口述复盘。

## 3. 并发与并行

### 3.1 并发

多个任务在一段重叠的时间范围内推进。即使只有一个 CPU 核心，也可以通过时间片切换形成并发。

并发关注的是任务之间如何协调：

- 是否访问共享状态。
- 是否需要等待。
- 是否可能相互阻塞。
- 执行顺序是否会影响结果。

### 3.2 并行

多个任务在同一时刻真正执行，通常依赖多个处理器核心。

并行关注的是如何同时使用计算资源提升处理能力。一个程序可以并发但不并行，也可以同时具备并发和并行。

## 4. 竞态条件与数据竞争

### 4.1 竞态条件

程序结果依赖多个线程执行的相对时序，并且某些时序会破坏业务不变量，就存在竞态条件。

例如：

```java
if (stock > 0) {
    stock--;
}
```

即使单独读取和写入都是原子的，两个线程仍可能同时通过检查，最终造成超卖。这是复合操作的竞态。

### 4.2 数据竞争

按照 Java 内存模型，如果两个线程对同一共享变量进行冲突访问：

- 至少一个访问是写；
- 两个访问之间没有 happens-before 顺序；

那么程序存在数据竞争。

竞态条件是业务正确性概念，数据竞争是内存模型中的精确定义。两者经常同时出现，但不是同一个概念。

## 5. 三个核心性质

### 5.1 原子性

一个操作是否表现为不可分割的整体。

`int` 的一次普通读取或写入可以是原子的，但 `value++` 是复合操作：

```text
读取 value
计算 value + 1
把结果写回 value
```

两个线程可能读取相同旧值，然后写回相同新值，造成一次更新丢失。

`DeterministicLostUpdateDemo` 让两个线程都先读取旧值，再同时写回，因此每次都能得到：

```text
期望：2
实际：1
```

### 5.2 可见性

一个线程写入共享变量后，另一个线程是否保证能够观察到该写入。

普通字段在没有正确同步时不提供跨线程的及时可见性保证。`VisibilityDemo` 中的普通停止标志存在数据竞争：

```java
while (running) {
}
```

它在某次运行中可能停止，也可能一直循环。即使连续运行一百次都停止，也不能由此推出代码符合 Java 内存模型。

### 5.3 有序性

编译器、JIT 和处理器可以在不改变单线程语义的前提下重排操作。跨线程观察时，如果缺少正确同步，就可能看到与源码直觉不同的顺序。

Java 内存模型不要求实现机械地按照源码顺序执行，而是规定一个执行结果是否属于合法行为。

## 6. 什么是 Java 内存模型

Java 内存模型，简称 JMM，定义了：

- 哪些内存操作属于线程间动作。
- 一个读操作允许看到哪些写操作。
- 哪些同步动作建立跨线程顺序。
- 存在数据竞争时，程序允许出现哪些行为。

JMM 不是“堆在内存、局部变量在工作内存”这样的物理内存布局图。它是一套语言级语义规则，使同一份 Java 程序可以运行在不同 JVM 和硬件平台上。

## 7. happens-before

如果动作 A happens-before 动作 B，则 A 的结果对 B 可见，并且 A 在内存语义上排在 B 之前。

本课程会持续使用以下规则：

1. 程序次序规则：同一线程中，前面的动作 happens-before 后面的动作。
2. 监视器规则：对一个监视器的解锁 happens-before 后续对同一监视器的加锁。
3. volatile 规则：对一个 volatile 字段的写 happens-before 后续对该字段的读。
4. start 规则：调用线程在 `Thread.start()` 之前的动作 happens-before 新线程中的动作。
5. join 规则：线程中的全部动作 happens-before 另一个线程从该线程的 `join()` 成功返回。
6. 传递性：A happens-before B，B happens-before C，则 A happens-before C。

### 7.1 start 规则

```java
state.input = 42;
worker.start();
```

工作线程可以可靠观察到 `input == 42`，即使 `input` 只是普通字段。

### 7.2 join 规则

```java
worker.start();
worker.join();
int result = state.output;
```

工作线程在结束前对 `output` 的写入，对 `join()` 成功返回后的读取可见。

因此 `join()` 既表示等待线程结束，也建立了内存可见性。

### 7.3 没有 happens-before 意味着什么

它不表示另一个线程一定看不到最新值，而是表示规范没有给出你需要的可见性和顺序保证。

并发正确性必须依赖规范保证，不能依赖“在我的机器上通常能看到”。

## 8. 代码实验说明

### 8.1 确定性丢失更新

文件：`DeterministicLostUpdateDemo.java`

两个线程执行：

```text
线程 1 读取 0
线程 2 读取 0
开放写回闸门
线程 1 写入 1
线程 2 写入 1
```

最终结果稳定为 1。这里使用 `CountDownLatch` 只是为了控制实验时序，相关 API 会在后续课程学习。

### 8.2 概率性并发计数

文件：`CounterRaceDemo.java`

多个线程同时执行大量 `value++`。通常能观察到丢失更新，但错误程序可能偶然得到正确结果，所以测试代码不能断言：

```java
assertTrue(actual < expected);
```

这类断言会产生偶发失败或偶发通过。

### 8.3 可见性观察

文件：`VisibilityDemo.java`

普通字段版本的错误来自缺少内存语义，不来自“这次是否成功退出”。因此自动化测试只验证 volatile 版本的保证，不要求普通字段版本必须复现不退出。

错误工作线程被设为 daemon，防止实验永久阻塞 JVM 退出。生产代码不能用 daemon 掩盖停止协议错误。

### 8.4 start/join 可见性

文件：`HappensBeforeDemo.java`

字段全部是普通 `int`，代码依靠 start 和 join 规则完成安全的数据传递。

## 9. 常见误区

### 误区一：结果正确，所以代码线程安全

错误。线程安全讨论的是所有被规范允许的执行，而不是本次执行。

### 误区二：`int` 写入是原子的，所以 `int++` 也是原子的

错误。单次读取、计算和写回组合后不是一个原子操作。

### 误区三：线程睡眠后会刷新缓存

错误。`Thread.sleep()` 和 `Thread.yield()` 没有内存同步语义。

### 误区四：没有 happens-before 就一定读取旧值

错误。它表示缺少保证，不代表每次都必然出现旧值。

### 误区五：`join()` 只是等待

错误。成功从 `join()` 返回还建立了线程终止相关的 happens-before。

## 10. 运行命令

```bash
mvn test
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson01.Lesson01Application
java -cp target/classes com.caesaemc.juc.lesson01.VisibilityDemo plain
java -cp target/classes com.caesaemc.juc.lesson01.VisibilityDemo volatile
```

## 11. 完成标准

- [ ] 能画出两个线程发生丢失更新的时间线。
- [ ] 能区分竞态条件和数据竞争。
- [ ] 能解释原子性、可见性、有序性。
- [ ] 能列出本课涉及的六条 happens-before 规则。
- [ ] 能解释 start 和 join 示例为什么不需要 volatile。
- [ ] 能解释为什么普通标志实验不能作为稳定单元测试。
- [ ] 完成 `ExerciseCounter` 并启用对应测试。
- [ ] 完成面试复盘中的口述题。

## 12. 官方参考

- [Java Language Specification 17：Threads and Locks](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)
- [JLS 17.4.5：Happens-before Order](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5)
- [Java SE 21 Thread API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [Java SE 21 java.util.concurrent](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
