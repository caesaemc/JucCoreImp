# JUC Core Lab

JucCoreImp 的 16 课交互式学习网站。所有课程位于同一个页面，通过顶部课程 Tab 切换，也支持 `?lesson=02`～`?lesson=16` 深链接。

## 每课固定组成

- 本地持久化的 8 项学习 TODO。
- 三个核心概念及适用边界。
- 六步可播放状态流，展示总体流程和每一步输入/输出。
- 四个数据区域，明确线程本地、共享状态、控制状态和资源容量。
- 四条数据路由，展示来源、同步通道、目标和保证。
- 至少三份与 GitHub 真实文件和行号对应的源码片段。
- 运行命令、动手练习、测试验收和五道面试口述题。

第 01 课保留专属的丢失更新、真实计数分布和 happens-before 交互实验；第 02～16 课使用统一页面协议并保留各自专属内容。

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

Java 源码或行号变化后重新生成网页源码片段：

```bash
npm run generate:sources
```

## 关键文件

```text
app/page.tsx                       课程 Tab、深链接和总进度
app/lesson-one.tsx                 第一课专属交互实验
app/lesson-workspace.tsx           第 02～16 课统一学习界面
app/course-data.ts                 15 课结构化课程内容
app/source-snippets.generated.ts   从 Java 源码生成的真实片段
scripts/generate-course-sources.mjs
app/globals.css                    视觉系统与响应式布局
tests/                             16 课结构和源码一致性验证
```

TODO 勾选状态只保存在浏览器 `localStorage`，不上传个人数据。
