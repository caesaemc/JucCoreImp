# 第 02 课练习

## 必做：线程安全序号

修复 `SequenceExercise`：

- 不使用原子类。
- 多线程生成的序号不能重复。
- `current()` 必须看到已完成的更新。
- 说明使用的是哪个监视器，以及它建立的 happens-before。

删除测试上的 `@Disabled` 后运行：

```bash
mvn -Dtest=SequenceExerciseTest test
```

## 推理题

判断下列修改是否安全，并说明原因：

1. 只给 `next()` 加 synchronized。
2. 只把 `sequence` 改为 volatile。
3. `next()` 和 `current()` 分别锁两个不同对象。
4. 两个方法都锁 `this`。

## 设计题

一个动态配置包含十个相关字段，每秒更新一次，每秒读取十万次。比较：

- 每个字段单独 volatile。
- 一个锁保护所有字段。
- 不可变配置对象加一个 volatile 引用。

从一致性、读成本、更新成本和维护难度说明选择。
