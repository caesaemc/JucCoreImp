# 第 07 课练习

## 必做：原子缓存加载

把 `CacheExercise.get` 改为 `computeIfAbsent`，然后启用测试：

```bash
mvn -Dtest=CacheExerciseTest test
```

回答：

- 为什么 loader 不应递归修改同一个 key？
- loader 抛异常后 map 中是否一定留下值？
- loader 返回 null 表示什么？

## merge 练习

使用 `ConcurrentHashMap<String, Long>` 统计单词：

```java
map.merge(word, 1L, Long::sum);
```

然后分析这种方案与 `ConcurrentHashMap<String, LongAdder>` 在热点 key 下的差异。

## 集合选型

为以下场景选型：

1. 每秒更新一次、每秒读取百万次的 20 个监听器。
2. 需要按价格区间并发查询的订单簿。
3. 无序 key-value 缓存。
4. 需要严格瞬时一致快照的报表。
