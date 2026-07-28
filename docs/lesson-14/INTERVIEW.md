# 第 14 课面试复盘

## 为什么优先不可变和线程封闭？

它们直接消除或减少共享可变状态，不需要靠每个访问者都正确加锁，组合和维护成本最低。

## Memoizer 为什么保存 Future？

Future 既代表进行中的计算，也代表最终结果。并发调用者可以共享同一次加载，避免先检查再加载造成缓存击穿。

## 失败结果应长期留在 Memoizer 吗？

通常不应无期限缓存。暂时故障会变成永久故障，因此示例在失败或取消后用条件 remove 删除原 Future，允许重试。生产系统还需退避和熔断，避免重试风暴。

## timeout 与 deadline 有何不同？

timeout 是某一步最多等待多久；deadline 是整条调用链必须结束的绝对时刻。每一步都用固定 timeout 会让总延迟累加。

## Semaphore 和线程池限制的是同一件事吗？

不一定。线程池限制执行载体及排队；Semaphore 应表达某个具体稀缺资源的容量。虚拟线程场景尤其要把两者分开。

## 如何避免许可泄漏？

只有成功 acquire 后才进入 `try/finally`，并在 finally 中 release。中断、业务异常、超时和取消路径都必须测试。

## 生产场景题

聚合接口 P99 上升且数据库被打满：

- 检查总 deadline 是否被逐层重置。
- 比较请求并发、等待许可数和数据库连接数。
- 为数据库设置独立 Bulkhead 和限时获取。
- 取消超时任务，并验证驱动真正终止请求。
- 非核心结果降级；核心结果按协议失败。
- 观察拒绝、超时、活跃、队列等待和下游延迟。

## 代码分析题

```java
if (!cache.containsKey(key)) {
    cache.put(key, load(key));
}
return cache.get(key);
```

即使 cache 是 ConcurrentHashMap，整个复合操作也不原子；并发线程可能重复加载，失败时也没有明确缓存语义。可使用 `computeIfAbsent`（loader 约束合适时）或缓存 Future 的 Memoizer。
