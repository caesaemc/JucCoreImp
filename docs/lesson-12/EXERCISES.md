# 第 12 课练习

## 必做：并行最大值

完成 `MaxTaskExercise`：

- 空数组应拒绝。
- 小于阈值时顺序求最大值。
- 大任务拆分。
- fork 一个分支，当前线程计算另一个。
- join 并取 max。

```bash
mvn -Dtest=MaxTaskExerciseTest test
```

## 基准设计

设计顺序求和与 ForkJoin 求和的 JMH：

- 参数化数组大小。
- setup 中生成数组。
- 多 fork 和预热。
- 返回计算结果防止消除。
- 比较不同 threshold。

第 15 课实现正式基准。

## 选型题

为以下任务选模型：

1. 递归目录大小计算。
2. 依次查询用户再按用户查询订单。
3. 5 万个阻塞 HTTP 请求。
4. 固定 8 个 CPU 密集图像任务。
