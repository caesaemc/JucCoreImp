# 第 14 课练习

## 必做：Bulkhead

完成 `BulkheadExercise`：

- 构造公平 `Semaphore`。
- 使用 timeout 限时获取许可。
- 未取得许可时返回 fallback。
- 取得许可后在 `finally` 中释放。
- 收到中断时向上抛出，不伪装成业务超时。

完成后移除测试上的 `@Disabled`：

```bash
mvn -Dtest=BulkheadExerciseTest test
```

## 设计题：订单聚合

为库存、价格、优惠和推荐四个下游写一页设计：

1. 入口总预算和每个下游上限。
2. 哪些结果是核心，哪些允许降级。
3. 每个下游的并发容量和依据。
4. 满载、超时、失败、取消的返回协议。
5. 优雅关闭和至少六个运行指标。

## 扩展：Memoizer 生命周期

为 `Memoizer` 设计 TTL 与最大容量。先回答：

- 过期时正在计算的 Future 是否取消？
- 多个线程发现过期时谁负责刷新？
- loader 永久阻塞时如何恢复？
- 淘汰是否可能破坏“同 key 单飞”语义？
