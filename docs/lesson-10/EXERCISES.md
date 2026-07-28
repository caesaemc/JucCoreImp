# 第 10 课练习

## 必做：线程池关闭

完成 `ShutdownExercise.shutdown`：

- 调用 shutdown。
- 在总超时内 awaitTermination。
- 超时则 shutdownNow。
- 再等待剩余时间。
- 捕获 InterruptedException 后 shutdownNow，并恢复中断状态。

```bash
mvn -Dtest=ShutdownExerciseTest test
```

## Future 题

实现一组任务共享 500ms 总 deadline：

1. 记录绝对截止时间。
2. 每次 get 前计算剩余时间。
3. 剩余时间小于等于零时取消未完成任务。
4. 区分成功、失败、超时和取消。

## 调度题

任务每次执行 800ms，周期参数 500ms：

- fixed-rate 的开始时间如何变化？
- fixed-delay 的开始时间如何变化？
- 任务抛异常后会怎样？
