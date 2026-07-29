# 第 01 课：共享数据与 Java 内存模型

> 状态：进行中
>
> 建议用时：60 分钟
>
> 学习页面：[打开第 01 课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=01)

这份文件既是讲义，也是学习记录。本课不再拆分多份文档。

## Todo

- [ ] 读完本页“三句话”
- [ ] 看懂丢失更新内存图
- [ ] 阅读并运行三份源码
- [ ] 完成线程安全计数器练习
- [ ] 不看答案口述三道面试题

## 只记三句话

1. 共享数据：能被多个线程访问的对象字段。
2. `value++` 不是一步，而是读取、加一、写回。
3. 没有明确的同步保证，运行正常也可能只是碰巧。

## 丢失更新图

```text
┌──────────────────────── JVM / 程序内存（简化） ────────────────────────┐
│ Counter.value=0 → A.snapshot=0 → B.snapshot=0 → Counter.value=1       │
│                         A、B 都从旧值 0 计算出 1，后一次写入覆盖前一次。 │
└───────────────────────────────────────────────────────────────────────┘
```

## 源码学习顺序

1. [UnsafeCounter.java](../../src/main/java/com/caesaemc/juc/lesson01/UnsafeCounter.java)
2. [DeterministicLostUpdateDemo.java](../../src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java)
3. [HappensBeforeDemo.java](../../src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java)

运行：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson01.Lesson01Application
```

## 三道面试题

1. 为什么 `i++` 不是线程安全的？

   因为它包含读取、计算、写回，多个线程会互相覆盖。

2. 没有 happens-before 就一定读到旧值吗？

   不一定，但程序没有可靠保证，碰巧正确不等于线程安全。

3. `Thread.sleep()` 能解决可见性吗？

   不能，它只影响调度，不建立内存同步保证。

## 学习记录

### 2026-07-28：开始第一课

- 已建立确定性丢失更新实验。
- 学习重点是先找共享字段，再拆解实际读写步骤。

## 有价值问答

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
