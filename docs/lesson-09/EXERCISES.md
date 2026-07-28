# 第 09 课练习

## 必做：显式有界线程池

修改 `PoolConfigExercise.create`：

- 直接构造 ThreadPoolExecutor。
- 使用明确容量的 ArrayBlockingQueue。
- 线程有业务前缀。
- 明确拒绝策略。
- 说明 core、max、queue 的联动。

启用测试：

```bash
mvn -Dtest=PoolConfigExerciseTest test
```

## 参数推理

分别推导第 1～6 个任务的路径：

```text
core = 2
max = 4
queue capacity = 2
所有任务都阻塞
```

然后说明第 7 个任务发生什么。

## 场景题

某线程池 core=10、max=200、使用无界 LinkedBlockingQueue，线上永远只有 10 个线程但队列持续增长。解释原因并给出改造步骤。
