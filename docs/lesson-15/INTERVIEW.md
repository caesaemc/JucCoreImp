# 第 15 课面试复盘

## 为什么并发测试不应依赖 sleep？

sleep 不证明另一个线程到达某个状态，也不建立业务所需的 happens-before。机器负载变化会让测试漏测或偶发失败。应使用 latch、barrier、phaser 等控制时序。

## JUnit 与 jcstress 的区别？

JUnit 验证业务协议和可构造的不变式；jcstress 通过大量受控执行探索 JMM 下的结果集合，并把结果标为可接受、关注或禁止。

## 为什么不能直接用 nanoTime 循环做微基准？

JIT 预热、死代码消除、常量折叠、GC、fork 隔离和测量开销都会影响结果。JMH 提供专门的基准生命周期，但仍需正确建模负载。

## 线程池队列持续增长说明什么？

长期看，到达率高于完成率，或 worker 被慢/阻塞任务占用。需要同时看 active、完成速率、队列等待、下游延迟和拒绝，不能只扩大队列。

## BLOCKED、WAITING、TIMED_WAITING 如何解释？

- BLOCKED：等待进入 synchronized monitor。
- WAITING：无期限等待，例如 Object.wait、join、park。
- TIMED_WAITING：带时限的 sleep、wait、join、park。

状态只是入口，必须结合完整栈和持锁关系。

## 如何诊断 CPU 空转？

定位高 CPU 线程，将系统线程 id 与 JVM 线程对应，多次抓取线程栈；若同一 RUNNABLE 栈持续出现，再用 JFR/剖析器确认热点和调用来源。

## 如何证明修复有效？

保留能稳定复现的测试或负载模型；修复后验证正确性、吞吐、P99、队列、拒绝和资源使用，并在相同环境对比。

## 场景题

接口 CPU 低、P99 高、无报错：

1. 看入口吞吐、在途数与线程池队列。
2. 抓多份 dump，区分 Future 等待、连接池等待、锁等待和 I/O。
3. 用 JFR 看 park、monitor、socket 和分配事件。
4. 找到真正的容量瓶颈，再调整超时、隔离或并发度。
5. 加入能覆盖该排队路径的回归压测。
