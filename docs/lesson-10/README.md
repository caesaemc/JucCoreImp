# 第 10 课：线程池工程实践、Future 与调度

## 交互式学习入口

[打开第 10 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=10)

网页包含本课 TODO、Future 超时取消状态流、执行器数据分布、真实源码行号、练习和面试验收。

## 学习目标

1. 正确处理 execute 与 submit 的异常差异。
2. 理解 FutureTask 的状态与结果传播。
3. 使用 timeout 和 cancel 构建截止时间。
4. 实现两阶段线程池关闭。
5. 区分 fixed-rate 和 fixed-delay。

## 1. execute 与 submit

`execute(Runnable)`：

- 任务抛出的未捕获异常会结束当前 worker 线程。
- 异常可以到达线程的 UncaughtExceptionHandler。

`submit(...)`：

- 任务被包装为 FutureTask。
- 异常存储在 Future 中。
- `get()` 抛 ExecutionException，真正原因在 `getCause()`。
- 如果从不调用 get，也不在 afterExecute 中检查 Future，异常可能被业务忽略。

`FutureFailureDemo` 展示失败状态和异常解包。

## 2. FutureTask 状态主线

源码中的主要状态可归纳为：

```text
NEW
→ COMPLETING → NORMAL
→ COMPLETING → EXCEPTIONAL
→ CANCELLED
→ INTERRUPTING → INTERRUPTED
```

关注点：

- run 通过 CAS 确保任务只由一个 runner 执行。
- 成功结果和异常都存入 outcome。
- get 在未完成时进入等待队列。
- 完成后唤醒等待者并清理 callable。
- `cancel(true)` 只请求中断正在运行的线程，任务仍需配合。

JDK 21 的 Future 还提供 `state/resultNow/exceptionNow`，适合在已知完成后做非阻塞检查。

## 3. 超时与取消

超时是调用者停止等待，不等于任务已经停止：

```text
future.get(timeout)
→ TimeoutException
→ future.cancel(true)
→ 任务是否结束取决于它是否响应中断
```

`DeadlineTaskRunner` 把成功、失败、超时和取消请求分开表达。

工程中还要区分：

- 单次调用 timeout。
- 一组操作共享的整体 deadline。
- 排队等待时间是否计入。
- 超时后结果是否允许继续写缓存或数据库。

## 4. 优雅关闭

推荐顺序：

```text
shutdown：停止接收新任务
awaitTermination：等待已接收任务完成
超时后 shutdownNow：中断运行任务并取出未开始任务
再次等待
当前线程被中断时恢复中断状态
```

`GracefulExecutor` 返回未开始任务，并明确是否进入强制阶段。

## 5. ScheduledThreadPoolExecutor

### scheduleAtFixedRate

按照计划开始时间推进。任务执行慢时不会让同一个周期任务并发执行，但后续执行可能紧接着追赶。

### scheduleWithFixedDelay

前一次执行结束后，再等待固定延迟开始下一次。

周期任务抛出未处理异常后，后续执行会被抑制。任务内部必须明确异常策略和监控。

取消大量定时任务时可评估 `setRemoveOnCancelPolicy(true)`，减少已取消任务在队列中停留。

`ScheduledSemanticsDemo` 记录 fixed-delay 的实际开始时间。

## 6. 代码导航

- `FutureFailureDemo`
- `DeadlineTaskRunner`
- `GracefulExecutor`
- `ScheduledSemanticsDemo`
- `ShutdownExercise`

## 7. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson10.Lesson10Application
```

## 8. 完成标准

- [ ] 能解释 submit 异常为什么容易丢失。
- [ ] 能画出 FutureTask 主要状态。
- [ ] 能说明 timeout 与 cancel 的边界。
- [ ] 能实现两阶段关闭。
- [ ] 能区分 fixed-rate 与 fixed-delay。
- [ ] 完成 `ShutdownExercise`。

## 官方参考

- [Future](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html)
- [FutureTask](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/FutureTask.html)
- [ScheduledThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ScheduledThreadPoolExecutor.html)
