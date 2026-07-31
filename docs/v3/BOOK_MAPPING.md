# 《Java并发编程的艺术》与 V3 映射

## 使用原则

V3 参考原书的知识骨架，不复制书中正文、插图或示例。讲义、动画、代码和
练习全部重新编写。

原书出版于 2015 年。V3 使用 Java 21，因此涉及 JVM 实现、容器源码和线程
模型时必须重新核对：

- 原理仍成立的内容，保留并重新证明；
- 属于特定旧版 JDK 实现的内容，标注为历史背景；
- 当前 JDK 已经变化的内容，以 Java 21 文档和实际源码为准；
- 原书没有覆盖的现代能力，作为 V3 扩展加入。

## 原书 11 章映射

| 原书章节 | V3 课程 | 处理方式 |
|---|---|---|
| 第 1 章：并发编程的挑战 | 第 01 课 | 保留上下文切换、死锁、资源限制，并增加可重复测量方法 |
| 第 2 章：Java 并发机制的底层实现原理 | 第 03、04 课 | 拆分 volatile、synchronized、CAS；JVM 实现细节按 Java 21 校正 |
| 第 3 章：Java 内存模型 | 第 03 课 | 作为全课程原理核心，覆盖重排序、happens-before、volatile、锁和 final |
| 第 4 章：Java 并发编程基础 | 第 02 课 | 调整到 JMM 之前，先建立线程生命周期、状态、通信和中断基础 |
| 第 5 章：Java 中的锁 | 第 05 课 | 以 AQS、Lock、Condition、读写锁为主线 |
| 第 6 章：Java 并发容器和框架 | 第 06 课 | API 语义保留，内部实现按当前 ConcurrentHashMap 和队列重新讲解 |
| 第 7 章：Java 中的原子操作类 | 第 04 课 | 与 CAS、ABA、原子更新和竞争代价合并 |
| 第 8 章：Java 中的并发工具类 | 第 06 课 | 放入批次协作、资源限制和阶段协作场景 |
| 第 9 章：Java 中的线程池 | 第 07 课 | 深入 ThreadPoolExecutor 参数、接纳路径、拒绝、关闭和观测 |
| 第 10 章：Executor 框架 | 第 07 课 | Executor、FutureTask、CompletionService、ForkJoin 和 CompletableFuture |
| 第 11 章：Java 并发编程实践 | 第 08 课 | 与边界、取消、诊断、压测和综合项目合并 |

## 为什么不照原书顺序

原书在第 2、3 章先进入底层机制和 JMM，第 4 章才系统介绍线程基础。V3
面向课程学习，调整为：

```text
并发问题
→ 线程基础
→ JMM
→ 同步实现
→ 高级组件
```

学习者先拥有可以运行、停止和观察的线程程序，再解释它为什么正确或错误，
认知负担更小。

## Java 21 扩展

V3 会在第 07、08 课补充：

- `Thread.ofVirtual()`；
- `Thread.startVirtualThread(...)`；
- `Executors.newVirtualThreadPerTaskExecutor()`；
- 虚拟线程与平台线程的适用边界；
- 虚拟线程降低线程成本，但不替代数据库、连接池和下游限流；
- `CompletableFuture` 的异常、取消和总 Deadline 编排；
- `jcmd`、线程转储、JFR、JMH 与 jcstress 的证据链。

## 资料来源

- [阿里云开发者社区：《Java并发编程的艺术》导读](https://developer.aliyun.com/article/109556)
- [华为云华章计算机：《Java并发编程的艺术》书摘与目录](https://bbs.huaweicloud.com/blogs/136206)
- [Oracle Java SE 21 并发包 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [Oracle Java SE 21 Thread API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [Oracle Java SE 21 Executors API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html)
