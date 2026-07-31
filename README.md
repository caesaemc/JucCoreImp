# JucCoreImp V3

这是 JUC 课程的第三版设计分支。

V3 参考《Java并发编程的艺术》的知识骨架，面向有约 8 年经验的 Java
开发者重新设计。课程不会复刻书中正文，而是把原书的原理主线重组为：

```text
问题与证据
→ 线程生命周期
→ Java 内存模型
→ synchronized / CAS / 原子类
→ AQS / Lock / Condition
→ 并发容器与同步工具
→ 线程池 / Executor / Future
→ JDK 21 与生产实战
```

## 当前状态

V3 的 8 课结构、`TaskHub` 累积项目和约 27 小时学习量已经确认。来自小林
Coding 的 68 道 JUC 面试题已全部映射到唯一主课次，作为覆盖检查表；课程答案
仍以 Java 21 语义、原理实验和代码证据为准。

第 01 课“并发的代价、竞态与证据”已经完成课程建设，包含两个确定性 `DEMO`、
一个保留 TODO 的 `TASK`、三组测试、讲义、学习记录，以及与 Java 源码逐行联动
的丢失更新和死锁动画。现在等待学习者完成本课 TODO 和显式作业验收；在确认前
不开发第 02 课。

- [V3 总体课程规划](COURSE_PLAN.md)
- [V3 压缩上下文](V3_CONTEXT.md)
- [V3 课程与学习进度](docs/v3/PROGRESS.md)
- [第 01 课讲义](docs/v3/lessons/lesson01.md)
- [第 01 课学习记录](docs/v3/lessons/lesson01-review.md)
- [原书章节与 V3 映射](docs/v3/BOOK_MAPPING.md)
- [68 道面试题覆盖矩阵](docs/v3/INTERVIEW_MAPPING.md)
- [V2 封存说明](archive/V2.md)

## 开始第 01 课

课程基线是 Java 21。当前机器默认可能仍是 Java 17；先在仓库根目录切换并确认：

```bash
source scripts/use-java21.sh
java -version
mvn -version
```

然后运行：

```bash
mvn test
node web/server.mjs
```

然后打开 <http://127.0.0.1:4173/>。网页左侧是交互实验、源码联动和运行命令，
右侧直接渲染讲义与学习记录。`mvn test` 只验证已完成的 `DEMO`，应保持绿色；
`TASK` 在学习者填写两个 TODO 前，下面的显式验收应当失败：

```bash
mvn -Dtest=UnsafeTaskStatisticsAcceptance test
```

可以随时校验题目是否遗漏或重复：

```bash
node scripts/verify-v3-interview-map.mjs
```

## V2

V2 已封存在 Git 标签 `course-v2-final`，对应提交
`9bbb70b61b6c56a902fbbbc39be659b6dba0c517`。

V2 线上页面暂时继续保留：

<https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site>

V3 第 01 课目前通过本地网页学习；V2 线上页面暂不替换。
