# JucCoreImp

面向有多年经验 Java 开发者的 JUC 代码化课程，兼顾系统学习、生产实践与中高级面试。16 课已经完整落库，建议按“错误现象 → 内存语义/实现原理 → 正确代码 → 测试证据 → 面试复盘”顺序学习。

## 课程状态

- [x] 第 01 课：并发问题与 Java 内存模型
- [x] 第 02 课：volatile、synchronized 与安全发布
- [x] 第 03 课：线程生命周期、中断与取消
- [x] 第 04 课：CAS、原子类与高竞争计数
- [x] 第 05 课：AQS、ReentrantLock 与 Condition
- [x] 第 06 课：同步工具与并发故障
- [x] 第 07 课：ConcurrentHashMap 与并发集合
- [x] 第 08 课：并发队列与生产消费
- [x] 第 09 课：ThreadPoolExecutor 原理
- [x] 第 10 课：线程池工程实践、Future 与调度
- [x] 第 11 课：CompletableFuture 异步编排
- [x] 第 12 课：ForkJoinPool 与任务模型选型
- [x] 第 13 课：虚拟线程与结构化并发
- [x] 第 14 课：并发设计模式与可靠性
- [x] 第 15 课：并发测试、诊断与性能
- [x] 第 16 课：高并发多下游聚合服务

完整设计见 [COURSE_PLAN.md](COURSE_PLAN.md)。

## 交互式学习网页

第一课已经提供可交互学习实验室：

- [打开 JUC Core Lab 第一课](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site)
- 逐步推演确定性丢失更新。
- 查看线程本地数据、共享堆数据及写回流向。
- 对比真实运行中的并发计数分布。
- 联动仓库源码行号和 GitHub 完整文件。
- 使用浏览器本地 TODO 逐项记录学习进度。

网页源码位于 [`web/`](web/)，后续课程会沿用同一套学习框架逐课扩展。

## 环境

- JDK 21
- Maven 3.9+

主工程使用 Java 21 正式 API。第 13 课会解释 JDK 21 中结构化并发的预览状态，但不把预览 API 混入默认构建。

检查环境并运行全部测试：

```bash
java -version
mvn test
```

构建后运行任意一课：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson01.Lesson01Application
java -cp target/classes com.caesaemc.juc.lesson14.Lesson14Application
java -cp target/classes com.caesaemc.juc.lesson16.CapstoneApplication
```

## 课程导航

| 课次 | 主题 | 学习入口 |
|---|---|---|
| 01 | 并发问题与 JMM | [交互网页](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site) · [讲义](docs/lesson-01/README.md) · [练习](docs/lesson-01/EXERCISES.md) · [面试](docs/lesson-01/INTERVIEW.md) |
| 02 | volatile、synchronized、安全发布 | [讲义](docs/lesson-02/README.md) · [练习](docs/lesson-02/EXERCISES.md) · [面试](docs/lesson-02/INTERVIEW.md) |
| 03 | 线程、中断、取消、ThreadLocal | [讲义](docs/lesson-03/README.md) · [练习](docs/lesson-03/EXERCISES.md) · [面试](docs/lesson-03/INTERVIEW.md) |
| 04 | CAS、ABA、原子类、LongAdder | [讲义](docs/lesson-04/README.md) · [练习](docs/lesson-04/EXERCISES.md) · [面试](docs/lesson-04/INTERVIEW.md) |
| 05 | AQS、ReentrantLock、Condition | [讲义](docs/lesson-05/README.md) · [练习](docs/lesson-05/EXERCISES.md) · [面试](docs/lesson-05/INTERVIEW.md) |
| 06 | 同步器、读写锁与并发故障 | [讲义](docs/lesson-06/README.md) · [练习](docs/lesson-06/EXERCISES.md) · [面试](docs/lesson-06/INTERVIEW.md) |
| 07 | ConcurrentHashMap 与并发集合 | [讲义](docs/lesson-07/README.md) · [练习](docs/lesson-07/EXERCISES.md) · [面试](docs/lesson-07/INTERVIEW.md) |
| 08 | 并发队列、生产消费、背压 | [讲义](docs/lesson-08/README.md) · [练习](docs/lesson-08/EXERCISES.md) · [面试](docs/lesson-08/INTERVIEW.md) |
| 09 | ThreadPoolExecutor 原理 | [讲义](docs/lesson-09/README.md) · [练习](docs/lesson-09/EXERCISES.md) · [面试](docs/lesson-09/INTERVIEW.md) |
| 10 | Future、调度、超时与关闭 | [讲义](docs/lesson-10/README.md) · [练习](docs/lesson-10/EXERCISES.md) · [面试](docs/lesson-10/INTERVIEW.md) |
| 11 | CompletableFuture 异步编排 | [讲义](docs/lesson-11/README.md) · [练习](docs/lesson-11/EXERCISES.md) · [面试](docs/lesson-11/INTERVIEW.md) |
| 12 | ForkJoin 与任务模型选型 | [讲义](docs/lesson-12/README.md) · [练习](docs/lesson-12/EXERCISES.md) · [面试](docs/lesson-12/INTERVIEW.md) |
| 13 | 虚拟线程与结构化并发 | [讲义](docs/lesson-13/README.md) · [练习](docs/lesson-13/EXERCISES.md) · [面试](docs/lesson-13/INTERVIEW.md) |
| 14 | 并发模式、deadline 与可靠性 | [讲义](docs/lesson-14/README.md) · [练习](docs/lesson-14/EXERCISES.md) · [面试](docs/lesson-14/INTERVIEW.md) |
| 15 | 测试、诊断、JFR、JMH、jcstress | [讲义](docs/lesson-15/README.md) · [练习](docs/lesson-15/EXERCISES.md) · [面试](docs/lesson-15/INTERVIEW.md) |
| 16 | 高并发多下游聚合服务 | [讲义](docs/lesson-16/README.md) · [练习](docs/lesson-16/EXERCISES.md) · [面试](docs/lesson-16/INTERVIEW.md) |

## 专项实验

JMH 微基准是独立工程：

```bash
mvn -f benchmarks/pom.xml clean package
java -jar benchmarks/target/benchmarks.jar \
  -wi 3 -i 5 -f 1 CounterBenchmark
```

jcstress 内存模型实验也是独立工程：

```bash
mvn -f jcstress/pom.xml clean package
java -jar jcstress/target/jcstress.jar \
  -t '.*LostUpdateStress.*'
```

第 15 课故障诊断实验：

```bash
java -cp target/classes \
  com.caesaemc.juc.lesson15.DiagnosticFaultLab \
  deadlock 60
```

将 `deadlock` 换为 `spin`、`backlog` 或 `contention`，再按进程打印的 PID 使用 `jcmd`、`jstack` 和 JFR。

## 如何学习

每课建议用 3～5 小时：

1. 先读讲义中的目标和错误模型。
2. 运行本课 Application 与测试，解释每个结果。
3. 阅读实现，画出状态、队列或生命周期。
4. 完成带 `Exercise` 后缀的 TODO，并启用对应的 `@Disabled` 测试。
5. 不看笔记回答 `INTERVIEW.md`，答案必须包含结论、原理、边界、场景和取舍。
6. 每四课做一次阶段复盘，第 16 课完成综合答辩。

练习代码故意不附现成 Solution；其测试默认禁用，避免影响完整工程构建。学习到该课时先独立完成，再做代码评审。

## 目录

```text
.
├── docs/lesson-01 ... lesson-16   # 讲义、练习、面试复盘
├── src/main/java/.../lesson01...  # 可运行代码与练习骨架
├── src/test/java/.../lesson01...  # 行为、边界和练习测试
├── benchmarks/                    # JMH 独立工程
├── jcstress/                      # jcstress 独立工程
├── web/                           # 交互式课程网页
├── COURSE_PLAN.md
└── pom.xml
```
