# 第 10 课面试复盘

## execute 和 submit 的异常区别？

execute 的未捕获异常通常到达工作线程异常处理；submit 使用 FutureTask 保存异常，需要 get 或显式检查 Future。

## Future.cancel(true) 一定停止任务吗？

不一定。它会在合适状态下请求中断 runner；任务若忽略中断或卡在不可中断调用中，仍可能继续。

## shutdown 和 shutdownNow？

shutdown 停止接收但处理已提交任务；shutdownNow 尝试中断运行任务并返回尚未开始的队列任务，两者都不承诺立即终止。

## fixed-rate 与 fixed-delay？

fixed-rate 按计划开始时间推进；fixed-delay 从上次结束后等待固定延迟。

## 周期任务抛异常后？

未处理异常会抑制后续周期执行，应在任务内部记录并决定是否继续。

## 场景题

服务停机 30 秒仍未退出：

- 检查任务是否响应中断。
- 检查不可中断 I/O 和锁等待。
- 查看队列中未执行任务数量。
- 分阶段 shutdown/await/shutdownNow。
- 为清理设置总 deadline，记录被放弃任务。
