# 第 03 课：线程生命周期、中断与取消

## 交互式学习入口

[打开第 03 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=03)

网页包含本课 TODO、两阶段终止状态流、线程控制数据分布、真实源码行号、练习和面试验收。

## 学习目标

1. 理解 Java 的六种线程状态及其含义。
2. 把 interrupt 当作协作式请求，而不是强制停止。
3. 正确处理会抛出 `InterruptedException` 的阻塞方法。
4. 实现两阶段终止和超时等待。
5. 正确使用 `wait/notifyAll`。
6. 限定 ThreadLocal 生命周期。

## 1. 六种线程状态

- `NEW`：创建但尚未启动。
- `RUNNABLE`：包括正在执行和等待 CPU 的可运行线程。
- `BLOCKED`：等待进入 synchronized 监视器。
- `WAITING`：无限期等待另一个线程动作，如无超时 `wait/join`。
- `TIMED_WAITING`：带超时等待或 sleep。
- `TERMINATED`：run 已结束。

Java 状态不是操作系统线程状态的一一映射。排障时需要结合堆栈顶部的方法、锁信息和持续时间。

`ThreadLifecycleDemo` 确定性观察 NEW、WAITING、TERMINATED。

## 2. 中断协议

`interrupt()` 做的是：

- 设置目标线程的中断状态。
- 如果线程阻塞在特定可中断方法中，使其抛出 `InterruptedException`。

它不会：

- 安全地杀死任意线程。
- 自动回滚业务状态。
- 保证线程立刻结束。

线程必须在合适的位置检查或响应中断。

## 3. InterruptedException 为什么容易处理错

许多阻塞方法抛出 `InterruptedException` 时会清除中断状态。

常见策略：

1. 方法允许抛出：继续向上传播。
2. 方法不能抛出但应结束任务：恢复中断状态并返回。
3. 线程生命周期所有者：执行必要清理后结束。

禁止空 catch：

```java
catch (InterruptedException ignored) {
}
```

这会让取消请求丢失。`CancellationExercise` 专门练习修复它。

## 4. 两阶段终止

第一阶段发出停止请求，第二阶段由工作线程收尾：

```text
调用者 interrupt
工作线程从阻塞中醒来
恢复或观察中断状态
退出主循环
finally 关闭资源、上报状态
调用者 join 等待结束
```

`TwoPhaseTerminator` 展示完整路径。

## 5. wait/notifyAll

调用 `wait/notify/notifyAll` 必须持有同一个对象监视器。

等待必须使用 while：

```java
synchronized (monitor) {
    while (!condition) {
        monitor.wait();
    }
}
```

原因包括虚假唤醒、多个消费者竞争以及被唤醒后条件再次失效。

`GuardedMailbox` 还展示了超时预算的正确写法：每次醒来重新计算剩余时间，而不是重复等待完整超时。

优先使用 `notifyAll`，除非能严格证明只唤醒一个任意等待者不会造成错误。

## 6. ThreadLocal

ThreadLocal 是“每线程一份变量”，不是跨线程传递机制。

线程池中的线程会长期复用，因此必须清理：

```java
threadLocal.set(value);
try {
    invoke();
} finally {
    threadLocal.remove();
}
```

`ThreadLocalScope` 还会恢复外层值，支持嵌套作用域。

## 7. 代码导航

- `ThreadLifecycleDemo`
- `TwoPhaseTerminator`
- `GuardedMailbox`
- `ThreadLocalScope`
- `CancellationExercise`

## 8. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson03.Lesson03Application
```

## 9. 完成标准

- [ ] 能区分 BLOCKED、WAITING、TIMED_WAITING。
- [ ] 能解释中断标志何时会被清除。
- [ ] 能写出不吞中断的任务。
- [ ] 能写出 while 形式的 wait。
- [ ] 能实现总超时而不是每次重置超时。
- [ ] 能说明 ThreadLocal 在线程池中的泄漏风险。
- [ ] 完成 `CancellationExercise`。

## 官方参考

- [Thread API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [JLS 17.2 Wait Sets and Notification](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.2)
