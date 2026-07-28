# 第 04 课练习

## 必做：CAS 扣款

补全 `BoundedBalanceExercise.withdraw`：

- 参数必须为正数。
- 余额不足返回 false。
- 多线程并发扣款不能出现负数。
- 只能通过成功 CAS 修改余额。

删除测试上的 `@Disabled` 后运行：

```bash
mvn -Dtest=BoundedBalanceExerciseTest test
```

## 推理题

1. CAS 失败是否说明发生异常？
2. CAS 循环中的计算能否包含不可重复的外部调用？
3. LongAdder 为什么不适合生成订单号？
4. ABA 一定是 bug 吗？
5. `weakCompareAndSet` 的使用需要怎样的循环？

## 扩展

为 `VarHandleCounter` 增加 `add(int delta)`，处理整数溢出的策略，并解释它的线性化点。
