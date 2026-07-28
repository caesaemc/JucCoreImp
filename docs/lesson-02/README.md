# 第 02 课：volatile、synchronized 与安全发布

## 学习目标

完成本课后，你应该能够：

1. 准确说明 `volatile` 提供和不提供的保证。
2. 解释 `synchronized` 为什么同时解决互斥和可见性。
3. 识别对象未安全发布和构造期间 `this` 逸出的问题。
4. 使用不可变对象发布一致快照。
5. 解释正确 DCL 单例中 `volatile` 的作用。

## 1. volatile 的两项核心语义

对同一个 volatile 字段：

- 写入 happens-before 后续读取，因此提供可见性。
- volatile 写之前的普通写不能被重排到它之后，volatile 读之后的普通读不能被重排到它之前。

它不提供复合操作原子性：

```java
private volatile int value;

void increment() {
    value++;
}
```

`value++` 仍然包含读取、计算、写回。`VolatileCounterDemo` 会继续观察到丢失更新。

适合 volatile 的典型情况：

- 单写多读的状态标志。
- 直接替换不可变配置快照。
- 当前值不依赖旧值的独立赋值。

不适合单独使用 volatile 的情况：

- `++`、`--`。
- check-then-act。
- 多个字段需要共同维护不变量。

## 2. synchronized 的两层作用

### 互斥

同一时刻只有一个线程持有某个对象监视器，因此可以保护复合状态转换。

### 内存语义

对监视器的解锁 happens-before 后续对同一监视器的加锁。临界区内的写在下一个获得同一锁的线程中可见。

锁对象必须一致：

```java
synchronized (lockA) {
    state++;
}

synchronized (lockB) {
    return state;
}
```

如果 `lockA` 和 `lockB` 不同，就没有形成所需的互斥和 happens-before。

## 3. 安全发布

安全发布意味着：其他线程不仅能看到对象引用，还能看到对象构造期间形成的正确状态。

常见方式：

- 在静态初始化期间完成对象构造。
- 通过 volatile 引用发布。
- 在同一把锁的保护下写入和读取引用。
- 放入具有内存一致性保证的并发容器。
- 正确构造不可变对象，避免构造期间 `this` 逸出。

`SafePublicationDemo` 每次先构造完整的 `Settings`，再用一次 volatile 写替换引用。读取者只会得到旧快照或新快照，不会得到字段混合的“半个快照”。

## 4. final 字段与不可变对象

如果对象被正确构造，且构造期间没有让 `this` 逸出，final 字段具有初始化安全性。

不可变快照有三个优势：

1. 构造完成后不再改变内部状态。
2. 读取者不需要锁住多个 getter。
3. 更新者可以在局部变量中准备新版本，再一次性替换引用。

final 不能补救 `this` 逸出：

```java
class Broken {
    static Broken published;
    final int value;

    Broken() {
        published = this; // 对象尚未构造完成
        value = 42;
    }
}
```

## 5. 双重检查锁

正确实现见 `DclSingleton`：

```text
第一次普通读取：避免每次都进入 synchronized
进入锁后第二次检查：防止多个线程重复创建
volatile 引用：安全发布构造完成的实例并限制重排序
局部变量：减少 volatile 读取次数
```

实际工程中，如果不需要延迟初始化参数，静态内部类或枚举通常更简单。

## 6. 代码导航

- `VolatileCounterDemo`：证明 volatile 不提供复合原子性。
- `SafePublicationDemo`：不可变快照加 volatile 引用。
- `DclSingleton`：正确 DCL。
- `SequenceExercise`：修复 volatile 序号生成器。
- `Lesson02Application`：统一入口。

## 7. 源码阅读提示

本课不要求阅读 JVM 汇编。阅读 JLS 和 OpenJDK 源码时关注：

- volatile 字段在源码中的角色。
- 状态是否由一个字段还是多个字段组成。
- 写入新状态前，对象是否已经完整构造。
- 读取和写入是否使用同一个同步机制。

## 8. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson02.Lesson02Application
```

## 9. 完成标准

- [ ] 能解释 volatile 为什么不能修复 `value++`。
- [ ] 能推导 synchronized 的监视器 happens-before。
- [ ] 能列出至少四种安全发布方式。
- [ ] 能解释 final 字段语义的前提。
- [ ] 能完整讲解 DCL 的两次检查和 volatile。
- [ ] 完成 `SequenceExercise`。

## 官方参考

- [JLS 17.4.5 Happens-before](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5)
- [JLS 17.5 final Field Semantics](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5)
