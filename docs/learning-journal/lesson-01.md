# 第 01 课学习档案：并发问题与 Java 内存模型

> 状态：进行中
> 开始日期：2026-07-29
> 完成日期：待填写
> 当前任务：第 1 项——建立第一课知识地图
> 交互网页：[第一课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site)
> 标准讲义：[lesson-01/README.md](../lesson-01/README.md)

## 1. 本课知识小结

本课的核心不是记住几个并发术语，而是建立一套可以证明并发程序是否正确的分析方法：

```text
共享可变状态
→ 哪些线程读写
→ 操作是否可以被穿插
→ 写入是否保证可见
→ 操作是否具有所需顺序
→ 是否存在 happens-before 证明
```

需要掌握：

1. 并发表示多个任务在重叠时间内推进，并行表示多个任务在同一时刻执行。
2. 竞态条件描述业务结果依赖时序；数据竞争是 JMM 中未被 happens-before 排序的冲突访问。
3. 原子性关注操作能否被穿插，可见性关注写入能否被其他线程保证观察，有序性关注跨线程顺序约束。
4. `value++` 包含读取、计算、写回，不是一个原子操作。
5. JMM 是 Java 语言级并发内存语义，不是堆、栈或 CPU Cache 的物理结构图。
6. happens-before 表示内存可见性与顺序保证，不等于简单的物理时间先后。
7. `start()` 和 `join()` 同时具有线程生命周期语义与内存同步语义。
8. 一次甚至多次运行正确，都不能单独证明并发程序正确。

## 2. 正确学习路径

严格按照以下顺序学习：

| 顺序 | 学习内容 | 学习入口 | 实际操作 | 完成标准 |
|---|---|---|---|---|
| 0 | 环境基线 | 项目根目录 | 检查 Java 21，运行 `mvn -q test` | 工程测试通过 |
| 1 | 知识地图 | [网页知识地图](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#knowledge-map) · [标准讲义](../lesson-01/README.md) | 区分五组核心概念 | 能用自己的话准确解释 |
| 2 | 确定性丢失更新 | [网页实验](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#lost-update) · [源码](../../src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java) | 先预测，再运行 | 解释结果为何必然为 1 |
| 3 | 并发数据分布 | [网页分布](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#distribution) · [CounterRaceDemo](../../src/main/java/com/caesaemc/juc/lesson01/CounterRaceDemo.java) | 多轮运行并记录结果 | 区分暴露错误与证明正确 |
| 4 | JMM 三个性质 | [网页三性质](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#three-properties) · [VisibilityDemo](../../src/main/java/com/caesaemc/juc/lesson01/VisibilityDemo.java) | 对比 plain 与 volatile | 能判断原子性、可见性、有序性问题 |
| 5 | happens-before | [网页数据流](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#happens-before) · [HappensBeforeDemo](../../src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java) | 画出 start/join 数据通路 | 能使用传递性证明最终可见性 |
| 6 | 五份源码精读 | [网页源码实验室](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#source-lab) | 对每个文件识别状态、线程和同步规则 | 理论结论能定位到具体代码 |
| 7 | 线程安全计数器 | [网页练习](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#practice) · [ExerciseCounter](../../src/main/java/com/caesaemc/juc/lesson01/ExerciseCounter.java) | 编码、启用测试、给出证明 | 测试通过且能说明 happens-before |
| 8 | 面试复盘 | [网页面试区](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#interview) · [INTERVIEW.md](../lesson-01/INTERVIEW.md) | 60～90 秒口述回答 | 结论、原理、边界、工程做法完整 |

## 3. 学习进度

- [ ] 建立第一课知识地图
- [ ] 推演确定性丢失更新
- [ ] 观察并发计数数据分布
- [ ] 讲清 JMM 三个性质
- [ ] 画出 happens-before 图
- [ ] 精读五份真实源码
- [ ] 完成 `ExerciseCounter`
- [ ] 完成口述与面试复盘

> 网页勾选用于即时反馈；这里的勾选用于 Git 历史和长期回顾。完成一个任务后，两处同步更新。

## 4. 学习过程记录

### 2026-07-29：建立学习方式

- 确认课程采用“真实 Java 代码 + 测试 + 交互网页”的组合，而不是只观看界面。
- 确认每个知识点都按照“预测 → 运行 → 解释 → 修改 → 测试 → 面试表达”学习。
- 已制定第一课八步学习路径。
- 当前尚未完成第一个知识 Todo，下一步先建立 JMM 知识地图。

## 5. 有价值问答

### Q1：课程是代码案例，还是只有界面展示？

- 日期：2026-07-29
- 问题：是否存在可以运行和修改的代码案例，还是课程内容只在网页中展示？
- 当时的理解：需要确认网页与源码的关系，避免课程退化为被动浏览。
- 最终结论：课程主体是 Java 21 源码、JUnit 测试和编码练习；网页只负责组织学习路径、可视化状态和关联源码。
- 原因：并发知识必须通过预测执行时序、运行实验、修改实现和正确性证明来掌握，仅看图无法形成工程能力。
- 源码或实验依据：
  - [DeterministicLostUpdateDemo.java](../../src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java)
  - [CounterRaceDemo.java](../../src/main/java/com/caesaemc/juc/lesson01/CounterRaceDemo.java)
  - [VisibilityDemo.java](../../src/main/java/com/caesaemc/juc/lesson01/VisibilityDemo.java)
  - [HappensBeforeDemo.java](../../src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java)
  - [ExerciseCounter.java](../../src/main/java/com/caesaemc/juc/lesson01/ExerciseCounter.java)
- 适用边界：网页中的数据和动画用于解释模型，最终结论仍需由 JMM 规则、源码和测试证据支撑。
- 面试表达：并发正确性不能依赖观察到的现象，必须结合可控实验与内存模型证明。
- 待继续验证：完成第一课后评估网页、源码、测试三者的学习效果是否一致。

### Q2：第一课应该按照什么顺序学习？

- 日期：2026-07-29
- 问题：如何把知识点、网页、源码、实验、练习和面试材料串成正确路径？
- 当时的理解：材料已经齐全，但如果顺序错误，容易先背 API，再补原理，形成碎片化知识。
- 最终结论：按照“知识地图 → 错误时序 → 数据分布 → JMM 性质 → happens-before → 源码 → 练习 → 面试复盘”推进。
- 原因：先观察确定性错误，再引入规范解释，最后使用代码和口述形成可验证、可迁移的理解。
- 源码或实验依据：本文件“正确学习路径”以及[第一课练习](../lesson-01/EXERCISES.md)。
- 适用边界：后续课程保持相同骨架，但会根据锁、队列、线程池等主题调整核心状态模型。
- 面试表达：学习并发 API 时，应先明确它解决的不变量和内存语义，再讨论实现、性能与选型。
- 待继续验证：完成第一课后根据实际耗时和理解难点调整后续课程节奏。

## 6. 实验记录

| 实验 | 命令/参数 | 运行前预测 | 实际结果 | 原因分析 | 是否通过 |
|---|---|---|---|---|---|
| 环境基线 | `mvn -q test` | 待记录 | 待运行 | 待记录 | 否 |
| 确定性丢失更新 | `DeterministicLostUpdateDemo` | 待填写 | 待运行 | 待填写 | 否 |
| 并发计数分布 | `Lesson01Application` | 待填写 | 待运行 | 待填写 | 否 |
| 普通停止标志 | `VisibilityDemo plain` | 待填写 | 待运行 | 待填写 | 否 |
| volatile 停止标志 | `VisibilityDemo volatile` | 待填写 | 待运行 | 待填写 | 否 |
| start/join 可见性 | `HappensBeforeDemoTest` | 待填写 | 待运行 | 待填写 | 否 |

## 7. 代码练习记录

- 练习目标：在不使用 `AtomicInteger` 的前提下实现线程安全计数器。
- 待修改文件：[ExerciseCounter.java](../../src/main/java/com/caesaemc/juc/lesson01/ExerciseCounter.java)
- 验收测试：[ExerciseCounterTest.java](../../src/test/java/com/caesaemc/juc/lesson01/ExerciseCounterTest.java)
- 初始问题：`value++` 存在 read-modify-write 竞态，`value()` 也缺少可见性保证。
- 实现方案：待学习者完成。
- 未选择方案及原因：待填写。
- 正确性证明：待填写。
- 测试命令：`mvn -q -Dtest=ExerciseCounterTest test`
- 测试结果：待填写。
- Git 提交：待填写。

## 8. 需要重点防止的错误理解

| 错误理解 | 正确理解 | 验证方式 |
|---|---|---|
| JMM 就是堆、栈和 CPU Cache 示意图 | JMM 是语言级内存语义规范 | 使用 happens-before 分析代码 |
| 单次运行正确就代表线程安全 | 正确性要求覆盖规范允许的执行 | 对比压力实验与规范证明 |
| `int` 写是原子的，所以 `int++` 也原子 | `int++` 是读取、计算、写回复合操作 | 确定性丢失更新实验 |
| `sleep()` 会让线程刷新缓存 | `sleep()` 没有内存同步语义 | 分析 `VisibilityDemo` |
| 没有 happens-before 就一定读到旧值 | 没有 happens-before 表示缺少保证 | 对比“可能观察到”与“规范保证” |
| `join()` 只负责等待线程结束 | 成功返回还建立目标线程到等待线程的可见性 | `HappensBeforeDemo` |

## 9. 面试回答沉淀

统一回答结构：

```text
结论 → 原理 → JMM 规范保证 → 边界/反例 → 工程做法
```

以下回答在完成对应学习任务后填写：

- [ ] 为什么 `i++` 不是线程安全的？
- [ ] 竞态条件和数据竞争有什么区别？
- [ ] 原子性、可见性、有序性分别是什么？
- [ ] happens-before 是物理时间顺序吗？
- [ ] `start()` 和 `join()` 有什么内存语义？
- [ ] `Thread.sleep()` 能修复可见性吗？
- [ ] 如何测试一个存在竞态的程序？

## 10. 课后复盘

> 完成本课八项任务后填写，不能提前用标准答案代替个人复盘。

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

## 11. 间隔回顾

### D+1

- [ ] 不看笔记画出原子性、可见性、有序性与 happens-before 的关系。
- [ ] 手工推演确定性丢失更新。
- [ ] 口述 `start()` 和 `join()` 的内存语义。

### D+7

- [ ] 重新实现一次线程安全计数器。
- [ ] 解释为什么压力测试不能证明并发正确性。
- [ ] 完成三道随机面试题。

### D+30

- [ ] 从一个生产计数错误场景完成问题定位和方案选型。
- [ ] 对比 `synchronized`、原子类和 `LongAdder` 的适用场景。

## 12. 下一步

当前只执行第一项：

1. 阅读[标准讲义](../lesson-01/README.md)第 3～7 节。
2. 打开[网页知识地图](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site/#knowledge-map)。
3. 用自己的话解释原子性、可见性、有序性和 happens-before。
4. 通过点评后，同时勾选网页与本文件中的第一项。
