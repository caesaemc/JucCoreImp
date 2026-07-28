# 第 03 课面试复盘

## 1. interrupt 会立即停止线程吗？

不会。它是协作式请求；任务需要检查中断状态或响应 `InterruptedException`。

## 2. interrupted 和 isInterrupted 的区别？

`Thread.interrupted()` 检查并清除当前线程状态；`isInterrupted()` 检查目标线程且不清除。

## 3. 捕获 InterruptedException 后为什么常要恢复中断？

抛出异常时状态通常已被清除。如果当前层不能继续抛出但要让上层或循环知道取消，应调用 `Thread.currentThread().interrupt()`。

## 4. BLOCKED 和 WAITING 有何不同？

BLOCKED 专指等待 synchronized 监视器；WAITING 是等待另一个线程动作，如 `wait()`、`join()` 或 `park()`。

## 5. wait 为什么必须放在 while 中？

防止虚假唤醒、错误通知，以及唤醒后条件被其他线程抢先改变。

## 6. sleep 会释放锁吗？

不会，也没有内存同步语义。

## 7. ThreadLocal 为什么可能泄漏业务数据？

线程池线程长期存活并被复用；如果任务不 remove，后续任务可能读到遗留值，关联对象也会延长存活。

## 场景题

服务关闭时线程池任务迟迟不退出。排查重点：

- 任务是否吞掉中断。
- 是否存在不可中断 I/O。
- 循环是否检查中断。
- finally 是否执行耗时或阻塞清理。
- shutdown、awaitTermination、shutdownNow 的调用顺序。
