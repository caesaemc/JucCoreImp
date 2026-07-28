# JucCoreImp

面向中高级 Java 开发者的 JUC 代码化课程。课程采用“错误示例 → 原理分析 → 正确实现 → 测试验证 → 面试复盘”的方式逐课推进。

## 当前进度

- [x] 第 01 课：并发问题与 Java 内存模型
- [ ] 第 02 课：volatile、synchronized 与安全发布
- [ ] 后续课程参见 [COURSE_PLAN.md](COURSE_PLAN.md)

## 环境

- JDK 17 或更高版本
- Maven 3.9+

第 13 课学习虚拟线程时需要切换到 JDK 21 或更高版本。

## 第一课快速开始

运行全部测试：

```bash
mvn test
```

运行第一课总览：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson01.Lesson01Application
```

单独观察非 `volatile` 标志。这个实验的每次结果可能不同：

```bash
java -cp target/classes com.caesaemc.juc.lesson01.VisibilityDemo plain
```

观察 `volatile` 标志：

```bash
java -cp target/classes com.caesaemc.juc.lesson01.VisibilityDemo volatile
```

## 学习资料

- [第一课讲义](docs/lesson-01/README.md)
- [第一课练习](docs/lesson-01/EXERCISES.md)
- [第一课面试复盘](docs/lesson-01/INTERVIEW.md)
