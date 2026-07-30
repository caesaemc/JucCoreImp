# JUC 快速面试课网页

一个页面承载全部 6 课：

- 顶部：6 课切换和浅色/深色按钮。
- 左侧固定：每课 5 项 Todo。
- 中间：可逐步播放的 JVM 内存图、真实源码、一个练习、三道题。
- 右侧固定：一页讲义。

课程合并：

```text
01        → 共享数据与 JMM
02        → volatile、锁与安全发布
03～06    → 线程协作、CAS、锁与同步器
07～08    → 并发集合与队列
09～13    → 线程池、异步与虚拟线程
14～16    → 可靠性、排障与综合项目
```

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

Java 源码行号变化后重新生成网页片段：

```bash
npm run generate:sources
```

## 关键文件

```text
app/page.tsx                       6 课切换、进度和配色
app/fast-course-data.ts            6 课精简讲义与合并关系
app/lesson-workspace.tsx           统一三栏学习界面
app/lesson-one-memory-lab.tsx      第一课 JVM 内存与丢失更新动画
app/lesson-one-simple-data.ts      第一课简明数据
app/course-data.ts                 原 16 课深入内容
app/source-snippets.generated.ts   从 Java 源码生成的片段
scripts/generate-course-sources.mjs
app/globals.css                    简化视觉与响应式布局
tests/                             页面与源码一致性检查
```

Todo 和主题只保存在浏览器 `localStorage`，不会上传个人数据。
