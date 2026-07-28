# 第 11 课：CompletableFuture 异步编排

## 学习目标

1. 把 CompletableFuture 理解为完成图而非语法糖。
2. 正确使用 thenApply、thenCompose、thenCombine。
3. 理解带 Async 与不带 Async 方法的执行线程。
4. 统一处理异常、超时和部分结果。
5. 避免默认 commonPool 和上下文丢失问题。

## 1. CompletionStage 图

每个 stage 在上游完成后触发。常见关系：

- 转换：`thenApply`
- 消费：`thenAccept`
- 继续异步依赖：`thenCompose`
- 合并两个独立结果：`thenCombine`
- 任一完成：`applyToEither`
- 等待全部：`allOf`
- 等待任一：`anyOf`

`allOf` 返回 `CompletableFuture<Void>`，仍需保存原始 Future 才能按类型收集结果。

## 2. thenApply 与 thenCompose

如果函数返回普通值：

```java
future.thenApply(this::transform)
```

如果函数本身返回 Future：

```java
future.thenCompose(this::loadAsync)
```

错误使用 thenApply 会得到 `CompletableFuture<CompletableFuture<T>>`。`CompositionExercise` 专门修复这一问题。

## 3. thenCombine

两个任务相互独立时并行启动，再合并：

```java
profile.thenCombine(preference, Result::new)
```

如果第二个任务依赖第一个任务的结果，应使用 thenCompose，不能为了“并行”破坏数据依赖。

## 4. 执行线程规则

不带 Async 的 continuation：

- 可能由完成上游的线程直接执行。
- 上游已完成时，也可能由注册 continuation 的线程执行。

带 Async：

- 使用显式 Executor，或默认 commonPool。

生产建议为阻塞下游、CPU 计算和关键业务分别提供明确执行器，避免无意占用 commonPool。

## 5. 异常处理

- `exceptionally`：失败时提供替代值。
- `handle`：成功和失败都转换。
- `whenComplete`：观察结果，通常不改变原有结果。

异常经常被 CompletionException 包装，需要解包到根因。

`AsyncAggregator` 把每个来源转换为 Outcome，因此一个来源失败不会让所有成功结果消失。

## 6. 超时与取消

- `orTimeout`：超时后异常完成。
- `completeOnTimeout`：超时后提供默认值。

CompletableFuture 的取消不等同于可靠中断底层任意任务。API 文档明确其取消主要以异常完成形式影响依赖 stage。必须把中断、HTTP 请求取消、数据库取消等能力放在实际执行层设计。

## 7. 上下文

ThreadLocal 不会自动可靠传播到任意异步线程池。可选方案：

- 显式参数。
- 提交任务时捕获并在 finally 清理。
- 框架提供的上下文传播。
- 虚拟线程和 ScopedValue 的适用场景在下一阶段讨论。

显式参数通常最容易测试和推理。

## 8. 代码导航

- `AsyncAggregator`
- `CompositionDemo`
- `CompositionExercise`

## 9. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson11.Lesson11Application
```

## 10. 完成标准

- [ ] 能比较 apply、compose、combine。
- [ ] 能说明 sync/async continuation 的线程。
- [ ] 能收集 allOf 的类型化结果。
- [ ] 能保留部分成功结果。
- [ ] 能解释 CF 取消边界。
- [ ] 完成 `CompositionExercise.loadFlat`。

## 官方参考

- [CompletableFuture](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [CompletionStage](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletionStage.html)
