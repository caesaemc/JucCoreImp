# 第 07 课：ConcurrentHashMap 与并发集合

## 交互式学习入口

[打开第 07 课 JUC Core Lab](https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=07)

网页包含本课 TODO、复合操作竞态与原子加载流程、Map 数据分布、真实源码行号、练习和面试验收。

## 学习目标

1. 理解单个线程安全方法不等于复合操作原子。
2. 正确使用 putIfAbsent、compute、merge。
3. 理解 ConcurrentHashMap 的读写与扩容主思路。
4. 理解弱一致迭代和聚合状态的边界。
5. 为 CopyOnWrite、跳表集合选择合适场景。

## 1. 复合操作

错误：

```java
if (!map.containsKey(key)) {
    map.put(key, load(key));
}
```

两个线程可能同时判断缺失并重复加载。ConcurrentHashMap 只能保证每个独立方法的契约。

常用原子方法：

- `putIfAbsent`
- `computeIfAbsent`
- `computeIfPresent`
- `compute`
- `merge`
- `replace`

`CompoundActionDemo` 确定性复现重复创建，并对比 compute。

## 2. compute 的边界

映射函数应当：

- 尽量短小。
- 不执行不可控的长时间阻塞。
- 不递归修改同一个 key。
- 能明确处理异常和 null。

ConcurrentHashMap 不允许 null key/value。computeIfAbsent 返回 null 表示不建立映射。

如果加载需要远程调用、超时、取消和防击穿，通常需要缓存 Future/Promise 或使用专业缓存库，而不是让慢调用长期占据 map 内部更新路径。

## 3. ConcurrentHashMap 源码主线

现代实现不再使用早期 Segment 数组作为整体设计。源码阅读重点：

```text
table：节点数组
空桶：CAS 安装首节点
冲突桶：在桶级同步下更新
链表过长：满足容量条件后树化
扩容：ForwardingNode 标记并允许多线程协助迁移
计数：baseCount 与分散计数单元降低热点竞争
```

读取通常不阻塞。某个 key 的已完成更新与报告该值的非 null 读取之间存在相应内存关系。

## 4. 弱一致性

迭代器：

- 不抛 `ConcurrentModificationException`。
- 反映创建时或之后某些时刻的元素。
- 不保证全局瞬时快照。
- 迭代器本身仍建议由一个线程使用。

`size/isEmpty/containsValue` 在并发更新时可能反映瞬时状态，适合监控估计，不应作为关键流程判断。

## 5. 其他并发集合

### CopyOnWriteArrayList

- 写入复制整个数组。
- 读和迭代非常便宜，迭代看到稳定快照。
- 适合监听器、路由表等读极多写极少且规模不大的集合。
- 不适合频繁写或超大数组。

### ConcurrentSkipListMap

- 按 key 有序。
- 支持并发范围查询。
- 通常比哈希表有更高常数成本。

## 6. 代码导航

- `ConcurrentCache`
- `CompoundActionDemo`
- `CopyOnWriteRegistry`
- `CacheExercise`

## 7. 运行

```bash
mvn test
java -cp target/classes com.caesaemc.juc.lesson07.Lesson07Application
```

## 8. 完成标准

- [ ] 能指出 containsKey+put 的竞态。
- [ ] 能正确选择 compute/merge/putIfAbsent。
- [ ] 能讲解 CHM 空桶、冲突桶、扩容主线。
- [ ] 能解释弱一致性。
- [ ] 能比较 CHM、CopyOnWrite、跳表。
- [ ] 完成 `CacheExercise`。

## 官方参考

- [ConcurrentHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)
- [OpenJDK ConcurrentHashMap 源码](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/concurrent/ConcurrentHashMap.java)
