# JucCoreImp

面向有经验 Java 开发者的 JUC 快速面试课。原 16 课已合并为 6 课，代码实验仍完整保留。

- [打开学习网页](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02)
- [查看 6 课总体规划](COURSE_PLAN.md)
- [查看学习档案](docs/learning-journal/README.md)
- [当前第 02 课唯一讲义](docs/learning-journal/lesson-02.md)

## 6 课学习路线

| 课次 | 主题 | 原内容 |
|---|---|---|
| 01 | 共享数据与 Java 内存模型 | 原 01 |
| 02 | volatile、synchronized 与安全发布 | 原 02 |
| 03 | 线程协作、CAS、锁与同步器 | 原 03～06 |
| 04 | 并发集合、队列与生产消费 | 原 07～08 |
| 05 | 线程池、异步任务与虚拟线程 | 原 09～13 |
| 06 | 可靠性、排障与综合项目 | 原 14～16 |

总学习时间约 10～12 小时。每课只做 5 件事：

1. 读一份讲义。
2. 看一张内存/数据图。
3. 阅读并运行源码。
4. 完成一个练习和测试。
5. 口述三道面试题。

网页统一使用一个界面：左侧固定 Todo，中间是可播放的内存更新图和源码，右侧固定一页讲义。进度和配色保存在当前浏览器。

## 当前学习：第 02 课

只区分三个选择：

```text
只替换一个开关或引用       → volatile
读取、判断、修改必须一起做 → synchronized / Lock
多个字段必须是同一版本     → 不可变对象 + volatile 引用
```

运行本课：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson02.Lesson02Application
```

练习测试：

```bash
mvn -q -Dtest=SequenceExerciseTest test
```

## 环境与验证

- JDK 21
- Maven 3.9+
- Node.js 22.13+（仅网页）

```bash
mvn test
cd web
npm test
npm run lint
```

## 目录

```text
docs/learning-journal/   每课唯一的讲义与学习记录
docs/lesson-01...16/     原始深入材料，快速主线完成后按需查阅
src/main/java/           16 个可运行代码包与练习
src/test/java/           行为测试和练习测试
benchmarks/              JMH 专项实验
jcstress/                Java 内存模型专项实验
web/                     6 课统一学习网页
```

练习代码故意保留 TODO；先自己完成，再进行代码评审。
