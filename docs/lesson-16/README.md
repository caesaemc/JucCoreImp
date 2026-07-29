# 第 16 课：高并发多下游聚合服务

## 交互式学习入口

[打开第 16 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=16)

网页包含最终 TODO、完整聚合请求状态流、任务/队列/许可/结果数据分布、真实源码行号、练习和面试答辩。

## 项目目标

本课不再引入新的孤立 API，而是把前 15 课组合成一个可运行、可测试、可诊断的服务内核：

- 并行调用多个模拟下游。
- 总 deadline 与每下游 timeout。
- 资源 Bulkhead、有界队列和拒绝背压。
- 取消传播、异常聚合、部分结果与关键结果判定。
- 平台线程池与虚拟线程两种执行模型。
- 优雅关闭、终态指标和轻量负载报告。

## 1. 架构与复用关系

```text
请求
  │
  ├─ DownstreamCall[]：名称、动作、timeout、critical
  │
  ▼
AbstractAggregationService
  ├─ DeadlineBudget（第 14 课）
  ├─ Future + ScheduledExecutor（第 10 课）
  ├─ Semaphore Bulkhead（第 6/13/14 课）
  ├─ 多结果聚合（第 11 课）
  ├─ LongAdder 指标（第 4/9 课）
  └─ GracefulExecutor（第 10 课）
       │
       ├─ PlatformAggregationService
       │    固定 worker + 有界队列 + AbortPolicy
       │
       └─ VirtualAggregationService
            每任务虚拟线程 + 资源许可
```

后续课程是在前课基础上升华，而不是复制一套互不相关的作业。

## 2. 稳定的调用协议

每个 `CallOutcome` 保留五种互斥终态：

| 状态 | 含义 | 上层常见动作 |
|---|---|---|
| SUCCESS | 下游在预算内返回 | 使用 value |
| FAILED | 下游执行并抛出业务/系统异常 | 核心失败或非核心降级 |
| TIMED_OUT | 单步 timeout 或总 deadline 到期 | 取消底层调用并降级 |
| REJECTED | 平台池和队列已饱和 | 快速背压，禁止静默丢任务 |
| CANCELLED | 上游中断或非超时取消 | 停止无用工作 |

`FailureInfo` 只输出稳定的异常类型和消息，不把带有任意对象图的 Throwable 当成接口 DTO。

输入和输出顺序一致；下游名称必须唯一。调用者可以用 name 建立结果映射，也能稳定对比测试。

## 3. 双层时间边界

每个任务的定时取消延迟为：

```text
min(该下游 timeout, 整体 deadline 剩余时间)
```

同时，结果收集始终使用同一个整体 deadline，而不是每次重新等待完整时长。

Future 的 `cancel(true)` 只是发出中断请求：

- `sleep`、`wait`、可中断锁和多数 JDK 阻塞操作会响应。
- 忙循环必须主动检查中断。
- 某些客户端需要调用自身取消 API。
- 已经发送到远端的请求是否终止，必须用真实驱动验证。

## 4. 两种执行模型

### 有界平台线程池

`PlatformAggregationService`：

- 固定 worker 控制平台线程数量。
- `ArrayBlockingQueue` 限制排队内存。
- `AbortPolicy` 把满载转成明确 REJECTED。
- Semaphore 可进一步限制某个真实下游资源。

这适合需要严格控制平台线程和队列、已有线程池监控体系的服务。

### 虚拟线程

`VirtualAggregationService`：

- 每个下游一个虚拟线程。
- 代码保持同步阻塞风格。
- 不建立“虚拟线程池”来限制数据库或 HTTP 并发。
- Semaphore 仍是资源容量的唯一事实来源。

这适合大量相互独立的阻塞 I/O。CPU 密集任务不会因为改成虚拟线程而变快。

## 5. 背压与容量

容量不是一个数字：

```text
入口在途请求
× 每请求下游数
= 潜在任务数

任务载体容量：平台 worker / 虚拟线程
排队容量：平台有界 queue
资源容量：Semaphore / 连接池 / 下游额度
时间容量：deadline
```

平台版本在提交阶段快速拒绝；虚拟线程版本允许廉价任务等待资源许可，但等待仍受 deadline 约束。真实 HTTP 入口还应设置在途请求上限。

## 6. 部分结果与降级

`DownstreamCall.critical` 将机制与策略连接：

- 全部成功：正常响应。
- 只有非关键下游失败：返回部分结果并标记 degraded。
- 任一关键下游失败：`hasCriticalFailure()` 为 true，由接口层决定错误码。

练习 `DegradationPolicyExercise` 要把这三种结果映射为 OK、PARTIAL、FAILED。不要在底层并发组件中硬编码 HTTP 状态码。

## 7. 指标与一致性

`AggregationMetrics` 记录：

- submitted 与 started。
- success、failure、timeout、rejection、cancellation。
- 当前与历史最大资源并发。

终态计数按每个输入调用只记一次。LongAdder 适合高并发累计，但快照不是跨字段的原子事务；监控指标用于趋势，不应用来结算资金。

还应在接入真实系统时增加：

- 按下游分组的延迟直方图。
- 等待许可与队列等待时间。
- 整体 P95/P99。
- 在途请求和降级比例。
- 底层连接池等待与远端状态码。

## 8. 优雅关闭

`close()` 的顺序：

1. 标记服务关闭，新聚合请求失败。
2. worker 停止接收并等待已有任务。
3. 超时后 `shutdownNow` 请求中断。
4. 最后停止 timeout scheduler。

生产框架应给正在执行的请求留出小于容器终止宽限期的 drain 时间。

## 9. 测试矩阵

`Lesson16Test` 覆盖：

- 成功、失败、单下游 timeout 的混合结果。
- 虚拟线程下真实资源并发不超过许可。
- timeout 中断合作式下游。
- 平台池饱和后返回 REJECTED。
- 30 个并发请求的 P50/P95 与指标一致性。
- 关闭后拒绝新请求。

这些测试验证协议。更高置信度还需要真实 HTTP 客户端取消测试、长时间 soak、故障注入和目标机器压测。

## 10. 运行

```bash
mvn test
mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson16.CapstoneApplication
```

运行后查看两种模型的各下游终态、降级标志和指标。

## 11. JFR 负载分析

先使用 `CapstoneLoadRunner` 调整请求数和下游延迟，再录制：

```bash
java -XX:StartFlightRecording=\
filename=target/capstone.jfr,settings=profile,dumponexit=true \
  -cp target/classes com.caesaemc.juc.lesson16.CapstoneApplication

jfr summary target/capstone.jfr
```

对比平台与虚拟版本时保持请求、资源许可、下游延迟和机器环境相同。关注吞吐、尾延迟、排队、CPU、分配、锁和虚拟线程事件，而不是只看线程数。

## 12. 完成标准

- [ ] 能画出一次请求的提交、排队、许可、执行、取消和收集流程。
- [ ] 能解释五种终态以及关键/非关键策略。
- [ ] 能说明平台与虚拟线程版本各自的背压位置。
- [ ] 能证明总 deadline 不会按下游数量累加。
- [ ] 能解释每个指标的含义与非原子快照边界。
- [ ] 完成降级练习、压力测试、JFR 分析和模拟答辩。
