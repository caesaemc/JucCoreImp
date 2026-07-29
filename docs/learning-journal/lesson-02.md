# 第 02 课：volatile、synchronized 与安全发布

> 状态：进行中
>
> 建议用时：75 分钟
>
> 学习页面：[打开第 02 课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02)

这份文件既是讲义，也是学习记录。本课不再拆分多份文档。

## Todo

- [ ] 读完本页“三句话”
- [ ] 看懂内存图和三条箭头
- [ ] 阅读并运行三份源码
- [ ] 修复 `SequenceExercise` 并通过测试
- [ ] 不看答案口述三道面试题

## 只记三句话

1. `volatile`：一个线程写完，另一个线程能可靠看到；但 `value++` 仍会丢更新。
2. `synchronized`：同一把锁一次只让一个线程进入；读和写必须用同一把锁。
3. 安全发布：先把对象造完整，再通过一个共享入口交给其他线程。

选型口诀：

```text
只替换一个开关或引用       → volatile
读取、判断、修改必须一起做 → synchronized / Lock
多个字段必须是同一版本     → 不可变对象 + volatile 引用
```

## 内存图

```text
┌──────────────────────────── JVM / 程序内存（简化） ────────────────────────────┐
│ writer 的局部变量      Settings 对象        ConfigRepository 对象     reader 局部变量 │
│ candidate = v1   →    完整配置字段     →    volatile current=v1  →   snapshot=v1   │
│    先造完整            对象不再修改            一次替换引用            只读一次引用      │
└───────────────────────────────────────────────────────────────────────────────┘
```

数据走三步：

1. writer 先在自己的线程里创建完整的 `Settings v1`。
2. writer 把 `current` 一次替换为 `v1`。
3. reader 读取一次 `current`，随后只使用这一个版本。

## 源码学习顺序

1. [VolatileCounterDemo.java](../../src/main/java/com/caesaemc/juc/lesson02/VolatileCounterDemo.java)：看懂为什么 `volatile int` 的 `++` 仍不安全。
2. [SafePublicationDemo.java](../../src/main/java/com/caesaemc/juc/lesson02/SafePublicationDemo.java)：看完整对象怎样通过 `current` 交给读线程。
3. [DclSingleton.java](../../src/main/java/com/caesaemc/juc/lesson02/DclSingleton.java)：看第一次检查、加锁、第二次检查和发布。
4. [SequenceExercise.java](../../src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java)：自己完成本课练习。

运行：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson02.Lesson02Application
```

观察时只回答：

- 共享数据是哪一个字段？
- 哪些线程读写它？
- 需要“看见新值”，还是“同一时间只能一个线程改”？

## 一个练习

目标：不使用原子类，让多个线程取得不重复、连续的序号。

修改 [SequenceExercise.java](../../src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java)，让 `next()` 和 `current()` 使用同一把锁。

```bash
mvn -q -Dtest=SequenceExerciseTest test
```

完成后写一句证明：

> `next()` 的读取、加一、写回不能被另一个线程插入；`current()` 使用同一把锁，因此能看到之前已经完成的写入。

## 三道面试题

### 1. volatile 能保证 `value++` 线程安全吗？

不能。`value++` 包含读取、加一、写回。两个线程可能读到同一个旧值，再写回同一个新值。

### 2. volatile 和 synchronized 怎么选？

只发布一个独立值时可用 `volatile`；多个步骤必须作为一个整体完成时用 `synchronized` 或锁。

### 3. 什么是安全发布？

其他线程不只看见对象引用，还能看见对象已经构造完成的正确状态。

## 学习记录

### 2026-07-29：开始第二课

- 课程已从 16 课合并为 6 课，但第二课主题不变。
- 页面、Todo 和讲义已压缩，当前先看内存图，再读源码。
- 下一步：运行 `VolatileCounterDemo`，先预测结果再看输出。

## 有价值问答

后续只记录会改变理解、影响代码选择或适合面试复盘的问题。

### 问题模板

- 问题：
- 当时怎么想：
- 正确结论：
- 代码或实验依据：
- 一句话面试回答：

## 课后复盘

- 我已经掌握：
- 我仍然容易混淆：
- 最有用的代码：
- 一周后需要重新回答的问题：
