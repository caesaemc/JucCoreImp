# 第 03 课练习

## 必做：修复取消任务

修改 `CancellationExercise`：

1. 收到 `InterruptedException` 后恢复中断状态。
2. 退出循环。
3. 删除测试的 `@Disabled`。

```bash
mvn -Dtest=CancellationExerciseTest test
```

## wait/notify 推理

回答：

1. 为什么 `wait()` 必须在 synchronized 中？
2. 为什么用 while 而不是 if？
3. `notify()` 后等待线程是否立即执行？
4. `sleep()` 是否释放监视器？
5. 如何实现一个总计 500ms 的超时等待？

## ThreadLocal 实验

删除 `ThreadLocalScope` 的 finally 清理，使用单线程线程池连续执行两个不同 requestId 的任务，观察第二个任务是否可能读取第一个任务遗留的值。实验后恢复正确实现。
