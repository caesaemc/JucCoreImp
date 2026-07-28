# 第一课练习

## 练习一：解释确定性丢失更新

先不要运行代码，阅读 `DeterministicLostUpdateDemo` 并回答：

1. 两个线程分别读取到什么值？
2. `CountDownLatch` 为什么能确保两个读取都发生在写回之前？
3. 为什么最终结果一定是 1，而不只是“很可能是 1”？
4. 这个例子中的冲突访问有哪些？

然后运行：

```bash
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson01.DeterministicLostUpdateDemo
```

## 练习二：完成线程安全计数器

修改：

```text
src/main/java/com/caesaemc/juc/lesson01/ExerciseCounter.java
```

要求：

- 不允许使用 `AtomicInteger`。
- `increment()` 不能丢失更新。
- `value()` 必须正确观察已经完成的更新。
- 说明你的实现建立了哪一条 happens-before 关系。

完成后删除 `ExerciseCounterTest` 上的 `@Disabled`：

```bash
mvn -Dtest=ExerciseCounterTest test
```

注意：压力执行只能帮助暴露错误，测试通过本身不能构成线程安全证明。最终还需要给出基于 JMM 的推理。

## 练习三：画出 happens-before 图

为 `HappensBeforeDemo` 画出以下动作：

```text
主线程写 input
主线程调用 start
工作线程读取 input
工作线程写 output
工作线程结束
主线程从 join 返回
主线程读取 output
```

标注：

- 程序次序边。
- start 同步边。
- join 同步边。
- 通过传递性得到的最终可见性。

## 练习四：分析错误的停止标志

阅读 `VisibilityDemo.PlainFlagTask`，回答：

1. 哪两个操作形成冲突访问？
2. 它们之间是否存在 happens-before？
3. 如果程序本次正常停止，代码是否因此线程安全？
4. 为什么不能使用 `Thread.sleep()` 修复？
5. daemon 设置解决了业务停止问题吗？

## 扩展实验

修改 `CounterRaceDemo` 中的参数并记录：

- 线程数：1、2、4、8。
- 每线程操作数：1 千、1 万、10 万。
- 每种参数运行 10 次。

观察线程数和操作次数如何影响“暴露错误的概率”。不要把观察结果误认为 JVM 必须产生的结果。
