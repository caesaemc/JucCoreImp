# JucCoreImp

面向有经验 Java 开发者的 JUC 快速面试课。讲义、动画、运行入口和主源码
统一为 `course01～course06` 六课。

- [打开学习网页](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=01)
- [查看 6 课总体规划](COURSE_PLAN.md)
- [查看学习档案](docs/learning-journal/README.md)
- [当前第 01 课学习记录](docs/learning-journal/lesson-01.md)

## 6 课学习路线

| 课次 | 主题 | 主源码 |
|---|---|---|
| 01 | 共享数据与 Java 内存模型 | `com.caesaemc.juc.course01` |
| 02 | volatile、synchronized 与安全发布 | `com.caesaemc.juc.course02` |
| 03 | 线程协作、CAS、锁与同步器 | `com.caesaemc.juc.course03` |
| 04 | 并发集合、队列与生产消费 | `com.caesaemc.juc.course04` |
| 05 | 线程池、异步任务与虚拟线程 | `com.caesaemc.juc.course05` |
| 06 | 可靠性、排障与综合项目 | `com.caesaemc.juc.course06` |

总学习时间约 10～12 小时。每课只做 5 件事：

1. 读一份讲义。
2. 看一张内存/数据图。
3. 阅读并运行源码。
4. 完成一个练习和测试。
5. 口述三道面试题。

网页统一使用一个界面：左侧固定 Todo，中间直接渲染完整 Markdown 讲义、每课独立设计的运行结构图和真实源码，右侧提供讲义目录。活动数据球表示真实的读取、写入、入队、唤醒或结果回传；进度和配色保存在当前浏览器。

`docs/learning-journal/lesson-01～06.md` 是讲义唯一来源。构建网页时会自动
同步完整正文、代码块、面试题、学习记录和复盘，不需要在网页与本地文档
之间切换。

## 当前学习：第 01 课

先把一行 `value++` 拆成真实的数据更新：

```text
堆对象 value=0
→ Thread A、B 分别读取旧值 0
→ 两个线程分别计算新值 1
→ 两次写回同一个 value
→ 最终 value=1，丢失一次更新
```

运行本课：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.course01.Course01Application
```

练习测试：

```bash
mvn -q -Dtest=Course01ExerciseTest test
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
src/main/java/.../course01...06/  六课主源码与运行入口
src/test/java/.../course01...06/  六课主线验收测试
src/main/java/.../lesson01...16/  保留的进阶实验，不属于主学习入口
benchmarks/              JMH 专项实验
jcstress/                Java 内存模型专项实验
web/                     6 课统一学习网页
```

练习代码故意保留 TODO；先自己完成，再进行代码评审。
