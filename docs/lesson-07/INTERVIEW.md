# 第 07 课面试复盘

## ConcurrentHashMap 如何实现高并发？

读取通常无锁；空桶可通过 CAS 安装，冲突桶更新在更细粒度范围同步；扩容可协作迁移，计数使用分散单元降低热点。

## ConcurrentHashMap 允许 null 吗？

不允许，因为并发环境下 `get == null` 需要明确表示当前没有映射，不能再与“映射值本身为 null”混淆。

## computeIfAbsent 一定只调用一次 loader 吗？

对一次成功建立且未被移除的映射，原子计算避免同时重复建立；如果返回 null、抛异常、映射被移除或后续重新计算，loader 仍可能再次执行，业务应理解其边界。

## 迭代时会抛 ConcurrentModificationException 吗？

不会。迭代是弱一致的，不代表全局瞬时快照。

## CopyOnWriteArrayList 适合什么？

集合较小、读和遍历极多、写极少的场景。写频繁或元素很多时复制成本和内存压力很高。

## 场景题

热点缓存 key 加载要调用 2 秒远程接口：

- 避免简单 check-then-act。
- 考虑存储代表在途结果的 Future，合并相同 key 请求。
- 加入超时、失败清除和重试边界。
- 不让慢 loader 无限占用内部计算路径。
