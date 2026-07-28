# 第 05 课练习

## 必做：一次性门闩

补全 `OneShotLatchExercise`：

```java
await  -> sync.acquireSharedInterruptibly(1)
open   -> sync.releaseShared(1)
```

要求：

- 打开前所有调用者等待。
- 打开后现有和后续调用者都直接通过。
- 支持等待期间中断。

删除测试上的 `@Disabled`：

```bash
mvn -Dtest=OneShotLatchExerciseTest test
```

## 源码推理

1. `Mutex` 为什么不是可重入锁？
2. 非持有线程调用 unlock 会发生什么？
3. Condition 为什么需要 `isHeldExclusively`？
4. signal 后为什么还要重新获取锁？
5. 如果 `BoundedBuffer` 用一个 Condition，正确性和效率分别如何？

## 扩展

为 `BoundedBuffer` 增加带超时的 `offer` 和 `poll`，确保循环中使用剩余纳秒而不是重置完整超时。
