# 第 08 课练习

## 必做：批量消费

补全 `BatchingQueueExercise.takeBatch`：

1. `maxBatchSize <= 0` 抛 IllegalArgumentException。
2. 使用 `take()` 阻塞取得第一个元素。
3. 使用 `drainTo(result, maxBatchSize - 1)`。
4. 返回批次。

```bash
mvn -Dtest=BatchingQueueExerciseTest test
```

## 设计题

日志写盘系统每秒平均 1 万条，突发 5 万条，磁盘只能持续处理 1.5 万条：

- 队列是否有界？
- 容量依据什么确定？
- 满载时阻塞、丢弃还是落盘备用？
- 如何监控排队等待时间？
- 关闭时如何确保已接受日志处理完成？

## API 题

分别说明 `add/offer/put/offer(timeout)` 在队列满时的行为。
