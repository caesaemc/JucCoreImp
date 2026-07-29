# 第 02 课学习档案：volatile、synchronized 与安全发布

> 状态：进行中
> 开始日期：2026-07-29
> 完成日期：待填写
> 当前任务：第 1 项——建立核心概念地图
> 交互网页：[第 02 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02)
> 标准讲义：[lesson-02/README.md](../lesson-02/README.md)

## 1. 本课知识小结

本课需要建立一棵共享状态选型树：

```text
共享状态需要什么保证？
├── 独立状态的可见性与发布
│   └── volatile
├── 读取旧值后再决定新值
│   └── 同一监视器、锁或原子操作
├── 多个字段必须保持同一版本
│   └── 同一把锁，或不可变快照 + volatile 引用
└── 把新对象交给其他线程
    └── 安全发布，并禁止构造期间 this 逸出
```

需要掌握：

1. `volatile` 提供可见性和特定有序性，但不提供复合操作互斥。
2. `value++` 即使操作 volatile 字段，仍然包含读取、计算、写回。
3. `synchronized` 对同一监视器同时提供互斥和 `unlock → lock` 的 happens-before。
4. 读写使用不同锁，不能建立需要的互斥和监视器同步边。
5. 安全发布不仅要让其他线程看到引用，还要让其看到构造完成的合法状态。
6. 不可变快照先在局部完整构造，再通过一次 volatile 引用替换，可以提供无锁一致读取。
7. final 字段初始化安全性的前提是对象正确构造且构造期间没有 `this` 逸出。
8. 正确 DCL 需要第一次检查、锁内第二次检查和 volatile 引用。

## 2. 正确学习路径

| 顺序 | 学习内容 | 学习入口 | 实际操作 | 完成标准 |
|---|---|---|---|---|
| 0 | 环境基线 | 项目根目录 | 运行本课已有测试 | 工程基线通过 |
| 1 | 三类并发契约 | [核心概念](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-concepts) · [标准讲义](../lesson-02/README.md) | 区分可见性、互斥、安全发布 | 能根据共享状态性质选型 |
| 2 | 不可变快照流程 | [总体流程](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-flow) | 推演局部构造、volatile 发布、读取和校验 | 能解释为什么不会出现混合版本 |
| 3 | 数据分布 | [数据区域](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-data) | 定位 candidate、current、Settings、sequence | 能区分线程本地和共享数据 |
| 4 | 数据流向 | [数据路由](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-routes) | 画出 volatile 和 monitor 两条同步通路 | 能说明每条边提供什么保证 |
| 5 | 源码精读 | [源码实验室](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-source) | 阅读安全发布、DCL、volatile 计数和练习 | 结论能够对应到具体代码 |
| 6 | 运行完整示例 | [运行区](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-practice) | 先预测，再运行 `Lesson02Application` | 能解释三组输出 |
| 7 | 线程安全序号 | [编码练习](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-exercise) · [SequenceExercise](../../src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java) | 修复实现、启用测试、给出证明 | 无重复、无缺口且 current 可见 |
| 8 | 面试复盘 | [面试区](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02#lesson-interview) · [INTERVIEW.md](../lesson-02/INTERVIEW.md) | 口述五道核心题和配置场景题 | 结论、原理、边界、取舍完整 |

## 3. 学习进度

- [ ] 建立核心概念地图
- [ ] 逐步推演总体流程
- [ ] 定位数据分布
- [ ] 画出数据流向
- [ ] 精读真实源码
- [ ] 运行本课完整示例
- [ ] 完成线程安全序号生成器
- [ ] 完成面试口述验收

> 网页勾选用于即时反馈；这里的勾选用于 Git 历史与长期回顾。完成一项后两处同步更新。

## 4. 学习过程记录

### 2026-07-29：开始第二课

- 第一课档案仍保持“进行中”，没有因为进入第二课而自动标记完成。
- 当前开始建立 `volatile`、监视器和安全发布的概念边界。
- 本课继续使用“预测 → 运行 → 解释 → 修改 → 测试 → 面试表达”的学习方式。
- 下一步：完成四个共享状态场景的方案分类。

## 5. 有价值问答

当前暂无。本课后续问题满足以下任意条件时追加：

- 修正对 `volatile` 或 `synchronized` 的常见误解。
- 涉及安全发布、final 字段或 `this` 逸出的边界。
- 涉及 DCL 的正确性证明。
- 能迁移到动态配置、缓存或单例等生产场景。

## 6. 实验记录

| 实验 | 命令/参数 | 运行前预测 | 实际结果 | 原因分析 | 是否通过 |
|---|---|---|---|---|---|
| 本课测试基线 | `mvn -q -Dtest=Lesson02Test test` | 待填写 | 待运行 | 待填写 | 否 |
| volatile 计数器 | `VolatileCounterDemo` | 待填写 | 待运行 | 待填写 | 否 |
| 不可变快照发布 | `SafePublicationDemo` | 待填写 | 待运行 | 待填写 | 否 |
| DCL 单例 | `Lesson02Application` | 待填写 | 待运行 | 待填写 | 否 |
| 线程安全序号 | `SequenceExerciseTest` | 待填写 | 待实现 | 待填写 | 否 |

## 7. 源码精读清单

按以下顺序阅读：

1. [VolatileCounterDemo.java](../../src/main/java/com/caesaemc/juc/lesson02/VolatileCounterDemo.java)
2. [SafePublicationDemo.java](../../src/main/java/com/caesaemc/juc/lesson02/SafePublicationDemo.java)
3. [DclSingleton.java](../../src/main/java/com/caesaemc/juc/lesson02/DclSingleton.java)
4. [SequenceExercise.java](../../src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java)
5. [Lesson02Application.java](../../src/main/java/com/caesaemc/juc/lesson02/Lesson02Application.java)

每个文件回答：

```text
共享状态是什么？
需要的是可见性、互斥还是安全发布？
同步边由哪个字段或监视器建立？
如果移除同步措施，哪个不变量会被破坏？
```

## 8. 代码练习记录

- 练习目标：不使用原子类，实现无重复、连续且可见的序号生成器。
- 待修改文件：[SequenceExercise.java](../../src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java)
- 验收测试：[SequenceExerciseTest.java](../../src/test/java/com/caesaemc/juc/lesson02/SequenceExerciseTest.java)
- 初始问题：`volatile` 不能把 `++sequence` 变成原子操作。
- 必须回答：
  1. 只同步 `next()` 是否完整？
  2. 只保留 volatile 是否安全？
  3. `next()` 与 `current()` 锁不同对象是否安全？
  4. 两个方法都锁 `this` 建立了什么 happens-before？
- 实现方案：待学习者完成。
- 正确性证明：待填写。
- 测试命令：`mvn -q -Dtest=SequenceExerciseTest test`
- 测试结果：待填写。
- Git 提交：待填写。

## 9. 需要重点防止的错误理解

| 错误理解 | 正确理解 | 验证方式 |
|---|---|---|
| volatile 变量天然线程安全 | 只有符合独立读写契约时才适合；复合更新仍会竞争 | `VolatileCounterDemo` |
| volatile 是轻量版 synchronized | 两者契约不同，volatile 不提供互斥 | 对比计数器和配置快照 |
| 写方法和读方法各自加锁就可以 | 必须使用同一个监视器才能形成所需同步边 | `SequenceExercise` 推理题 |
| 其他线程看到引用就代表安全发布 | 还必须保证构造效果可见 | `SafePublicationDemo` |
| final 字段在任何情况下都安全 | 初始化安全性要求正确构造且没有 `this` 逸出 | 构造期间发布反例 |
| 多个 volatile 字段可以组成一致快照 | 每个字段独立可见不等于跨字段原子一致 | 动态配置设计题 |
| DCL 的 volatile 只用于避免缓存旧值 | 它还限制重排序并安全发布构造完成的实例 | `DclSingleton` |

## 10. 面试回答沉淀

统一回答结构：

```text
结论 → 原理 → happens-before/源码依据 → 边界 → 工程选型
```

- [ ] volatile 能保证原子性吗？
- [ ] volatile 和 synchronized 应该如何选择？
- [ ] synchronized 锁的是什么？
- [ ] 什么是安全发布？有哪些方式？
- [ ] final 字段一定线程安全吗？
- [ ] DCL 为什么必须使用 volatile？
- [ ] 高频读取的多字段动态配置如何实现一致无锁读取？

## 11. 课后复盘

> 本课八项任务完成后填写。

### 已经掌握

- 待填写。

### 仍然模糊

- 待填写。

### 最有价值的实验

- 待填写。

### 本课最重要的认知变化

- 待填写。

### 可以迁移到生产的结论

- 待填写。

### 下一课前需要补充

- 待填写。

## 12. 间隔回顾

### D+1

- [ ] 不看笔记画出 volatile、monitor 和安全发布的契约边界。
- [ ] 解释 volatile 为什么不能修复 `value++`。
- [ ] 画出不可变快照的发布数据流。

### D+7

- [ ] 重新实现线程安全序号生成器并证明正确。
- [ ] 口述 DCL 的两次检查和 volatile 作用。
- [ ] 完成动态配置场景题。

### D+30

- [ ] 从生产代码中找一个发布或锁对象错误案例。
- [ ] 比较锁、不可变快照和原子类的适用场景。

## 13. 当前学习任务

先完成第一项“建立核心概念地图”，暂时不运行代码。

对下面四个场景分别判断应该优先使用什么方案，并说明需要的并发保证：

1. 一个线程更新 `running`，多个线程只读取停止标志。
2. 多个线程执行 `count++`。
3. 十个相关配置字段每秒整体更新一次、每秒读取十万次。
4. 转账时需要同时修改两个账户余额并保持总额不变。
