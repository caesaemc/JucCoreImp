# V3 课程与学习进度

> 更新日期：2026-07-31
>
> 课程建设进度由仓库维护；个人学习进度由学习者勾选。

## 一、V3 基线建设

- [x] 确认 8 课路线、`TaskHub` 累积主线和约 27 小时学习量
- [x] 完成《Java并发编程的艺术》章节映射
- [x] 完成 68 道面试题的唯一课次映射与自动校验
- [x] 建立 `DEMO / TASK / TEST / REVIEW` 源码角色契约
- [x] 建立 V3 分屏学习网页骨架

## 二、课程建设进度

- [x] 第 01 课：丢失更新 DEMO、死锁 DEMO、TASK 骨架、TEST、讲义、复盘和动画
- [ ] 第 01 课：学习者完成 TODO 并通过验收
- [ ] 第 02 课：线程生命周期、状态、通信与中断
- [ ] 第 03 课：JMM、重排序与安全发布
- [ ] 第 04 课：synchronized、CAS、ABA 与原子类
- [ ] 第 05 课：AQS、Lock、Condition 与读写控制
- [ ] 第 06 课：并发容器、阻塞队列与同步工具
- [ ] 第 07 课：ThreadPoolExecutor、Executor 与 Future
- [ ] 第 08 课：Java 21、可靠性、诊断与综合验收

## 三、第 01 课个人学习 Todo

网页会在当前浏览器中保存勾选状态；更完整的实验、问答和复习记录写入
[`lesson01-review.md`](lessons/lesson01-review.md)。

网页的 8 项 Todo 与讲义“本课结束条件”是唯一结课门槛。下面只是把这些门槛
拆成更细的执行与取证步骤，不是另一套额外验收标准。

- [ ] 确认 Java 和 Maven 都在 Java 21 上运行
- [ ] 从源码标出共享字段与线程私有快照，再运行 `LostUpdateDemoTest`，稳定观测期望 2、实际 1
- [ ] 在网页中单步走完 `read-read-add-add-write-write`
- [ ] 用死锁四条件解释代码，再运行 `DeadlockDemoTest` 核对两个 `BLOCKED` 线程的等待环
- [ ] 使用 `DeadlockDemo --hold` 和 `jcmd` 保留一次真实线程转储
- [ ] 不引入锁或原子类，完成 `UnsafeTaskStatistics` 中的两个 TODO
- [ ] 运行 `UnsafeTaskStatisticsAcceptance`，使两个验收全部通过
- [ ] 完成 Q02、Q04、Q05、Q22、Q52、Q68 的一次不看稿口述
- [ ] 把有价值的问题、证据和误区写入学习记录

只有网页与讲义中的 8 项结课门槛完成并由学习者确认后，才开始建设第 02 课。
