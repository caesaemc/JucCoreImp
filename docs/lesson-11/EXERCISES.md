# 第 11 课练习

## 必做：展平依赖异步调用

完成 `CompositionExercise.loadFlat`：

```java
return loadUser.apply(id).thenCompose(loadDetail);
```

启用：

```bash
mvn -Dtest=CompositionExerciseTest test
```

## 聚合练习

扩展 `AsyncAggregator`：

- 增加整体 deadline，不为每个来源重置完整超时。
- 输出来源耗时。
- 区分超时、业务失败和取消。
- 全部失败时让聚合 Future 失败。

## 线程题

打印以下阶段的线程名：

- `supplyAsync` 指定执行器。
- `thenApply`。
- `thenApplyAsync` 不指定执行器。
- `thenApplyAsync` 指定执行器。

不要把一次观察当作完整线程契约，结合 API 说明回答。
