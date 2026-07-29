# JUC Core Lab

JucCoreImp 的交互式学习网页。当前版本聚焦第 01 课“并发问题与 Java 内存模型”，后续课程按同一信息架构逐课扩展。

## 第一课页面组成

- 本地持久化的 8 项学习 TODO。
- `value++` 丢失更新逐步推演。
- 线程本地变量、共享堆对象和同步闸门的数据分布图。
- `UnsafeCounter` 与 `SynchronizedCounter` 的真实运行数据对比。
- `start`、`join` 与传递性组成的 happens-before 数据流。
- 与 GitHub 真实文件和行号对应的源码浏览器。
- 动手练习、终端命令和面试口述卡片。

## 本地运行

需要 Node.js 22.13 或更高版本：

```bash
npm install
npm run dev
```

验证：

```bash
npm test
npm run lint
```

## 关键文件

```text
app/page.tsx       页面内容、交互和课程数据
app/globals.css    视觉系统与响应式布局
app/layout.tsx     页面元数据和分享卡片
public/og.png      专属社交分享图
tests/             服务端渲染验证
```

TODO 勾选状态只保存在浏览器 `localStorage`，不上传个人数据。
