# 第 11 课面试复盘

## thenApply 与 thenCompose？

thenApply 把值映射为值；thenCompose 用于返回 CompletionStage 的函数并展平嵌套。

## thenCombine 与 thenCompose？

combine 合并相互独立的两个阶段；compose 表示后续异步阶段依赖前一结果。

## 不带 Async 在哪个线程执行？

可能由完成上游的线程执行；如果上游已完成，也可能由注册动作的线程执行。不能假定固定线程池。

## allOf 如何获得结果？

保留原始 Future 列表，allOf 完成后逐个 join/get；allOf 本身只返回 Void。

## handle、exceptionally、whenComplete？

handle 同时转换成功和失败；exceptionally 仅恢复失败；whenComplete 主要观察并保留原结果语义。

## CompletableFuture.cancel(true) 会中断任务吗？

不能把它视为可靠的底层线程中断机制。需要在实际执行器、网络调用和任务代码层设计取消。

## 场景题

三个下游并行查询，一个失败是否让接口失败：

- 先定义业务一致性：全部必须成功还是允许部分结果。
- 为每个来源保留 Outcome。
- 使用整体 deadline。
- 关键来源失败可让聚合失败，非关键来源降级。
- 使用独立执行器防止一个下游拖垮所有异步任务。
