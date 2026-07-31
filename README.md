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

当前只进行 V3 总体设计，尚未开始编写第一课代码和网页。

- [V3 总体课程规划](COURSE_PLAN.md)
- [V3 压缩上下文](V3_CONTEXT.md)
- [原书章节与 V3 映射](docs/v3/BOOK_MAPPING.md)
- [V2 封存说明](archive/V2.md)

## V2

V2 已封存在 Git 标签 `course-v2-final`，对应提交
`9bbb70b61b6c56a902fbbbc39be659b6dba0c517`。

V2 线上页面暂时继续保留：

<https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site>

V3 总体设计通过评审前，不替换线上页面。
