# 第 04 课：CAS、原子类与高竞争计数

## 学习目标

1. 理解 CAS 的预期值、更新值和成功条件。
2. 能写出具有重试边界意识的 CAS 循环。
3. 解释 ABA 以及版本戳方案。
4. 理解 VarHandle 是公开、受支持的底层访问 API。
5. 区分 AtomicLong 与 LongAdder 的语义和选型。

## 1. CAS

CAS 的逻辑是：

```text
如果当前值仍等于 observed
    更新为 next 并成功
否则
    失败，由调用者重新读取和计算
```

`VarHandleCounter` 展示标准循环：

```java
do {
    observed = get();
} while (!compareAndSet(observed, observed + 1));
```

CAS 避免了阻塞锁，但不是“没有代价”：

- 高竞争时大量失败重试消耗 CPU。
- 复杂状态需要不可变对象或多个字段编码。
- 操作必须能安全重试。
- 仍需考虑饥饿和退避。

## 2. 原子类

- `AtomicInteger/AtomicLong`：单值原子更新。
- `AtomicReference`：引用级 CAS。
- 字段更新器：避免为每个对象额外创建原子包装器，但使用限制更多。
- `AtomicStampedReference`：值加版本戳。
- `AtomicMarkableReference`：值加布尔标记。

优先使用 `updateAndGet`、`accumulateAndGet` 等组合 API，避免自己写两个分离的 get/set。

## 3. ABA

线程观察到 A，期间其他线程完成 A→B→A。普通 CAS 只比较当前仍是 A，因此会成功，但无法判断中间是否发生变化。

ABA 只有在“中间变化具有业务意义”时才是问题。解决方式包括：

- 版本号或时间戳。
- 不复用节点。
- 把值和版本编码为同一不可变状态并 CAS 引用。

`AbaDemo` 对比普通引用与带戳引用。

## 4. VarHandle

VarHandle 支持：

- plain
- opaque
- acquire/release
- volatile
- CAS 和原子更新
- 内存栅栏

业务代码通常使用更高层原子类。学习 VarHandle 的价值在于理解 JDK 并发源码，并在确有必要时使用受支持的公开 API，而不是依赖 Unsafe。

## 5. LongAdder

AtomicLong 在热点更新时所有线程竞争同一个值。LongAdder 把竞争分散到多个 cell，读取时求和。

选择：

- 需要每次读都具备单点原子值语义：AtomicLong。
- 高并发统计，允许读取是并发过程中的近似快照：LongAdder。
- 所有写入完成后再读取：两者都能得到最终总数。

`sum()` 与并发更新不是一个线性化的原子快照，不能用于余额、序列号等强一致状态。

## 6. 性能实验边界

`AdderComparisonDemo` 只验证最终语义，不宣称是性能基准。可靠比较需要 JMH：

- 预热 JIT。
- 防止死代码消除。
- 多 fork。
- 参数化线程数。
- 分离 setup 与测量代码。

第 15 课会完成正式基准。

## 7. 代码导航

- `VarHandleCounter`
- `AbaDemo`
- `AdderComparisonDemo`
- `BoundedBalanceExercise`

## 8. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson04.Lesson04Application
```

## 9. 完成标准

- [ ] 能口述 CAS 循环。
- [ ] 能说明 CAS 在高竞争下的成本。
- [ ] 能构造 ABA 时间线。
- [ ] 能比较 AtomicLong 与 LongAdder。
- [ ] 能说明 LongAdder 不能做余额。
- [ ] 完成 `BoundedBalanceExercise`。

## 官方参考

- [VarHandle API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/VarHandle.html)
- [java.util.concurrent.atomic](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/package-summary.html)
