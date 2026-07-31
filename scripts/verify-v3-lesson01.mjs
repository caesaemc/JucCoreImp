import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const repositoryRoot = new URL("../", import.meta.url);
const requiredFiles = [
  "docs/v3/lessons/lesson01.md",
  "docs/v3/lessons/lesson01-review.md",
  "docs/v3/PROGRESS.md",
  "src/main/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemo.java",
  "src/main/java/com/caesaemc/juc/v3/labs/lesson01/DeadlockDemo.java",
  "src/main/java/com/caesaemc/juc/v3/labs/lesson01/Lesson01DemoMain.java",
  "src/main/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatistics.java",
  "src/test/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemoTest.java",
  "src/test/java/com/caesaemc/juc/v3/labs/lesson01/DeadlockDemoTest.java",
  "src/test/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatisticsAcceptance.java",
  "web/index.html",
  "web/styles.css",
  "web/app.js",
  "web/server.mjs",
  "scripts/use-java21.sh",
];

for (const path of requiredFiles) {
  await access(new URL(path, repositoryRoot));
}

async function text(path) {
  return readFile(new URL(path, repositoryRoot), "utf8");
}

function assertInOrder(content, fragments, description) {
  let cursor = -1;
  for (const fragment of fragments) {
    const next = content.indexOf(fragment, cursor + 1);
    assert.ok(next > cursor, `${description}缺少或顺序错误：${fragment}`);
    cursor = next;
  }
}

function count(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

const lesson = await text("docs/v3/lessons/lesson01.md");
const review = await text("docs/v3/lessons/lesson01-review.md");
const task = await text(
  "src/main/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatistics.java",
);
const acceptance = await text(
  "src/test/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatisticsAcceptance.java",
);
const javaFiles = (
  await Promise.all(
    requiredFiles
      .filter((path) => path.endsWith(".java"))
      .map((path) => text(path)),
  )
).join("\n");
const html = await text("web/index.html");
const css = await text("web/styles.css");
const app = await text("web/app.js");
const server = await text("web/server.mjs");
const java21Switch = await text("scripts/use-java21.sh");
const lostUpdateDemo = await text(
  "src/main/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemo.java",
);

for (const question of ["Q02", "Q04", "Q05", "Q22", "Q52", "Q68"]) {
  assert.ok(lesson.includes(question), `讲义未覆盖 ${question}`);
  assert.ok(review.includes(question), `学习记录未覆盖 ${question}`);
}

const plannedMinutes = [...lesson.matchAll(/^### 第 \d+ 步：.*约 (\d+) 分钟$/gm)]
  .map((match) => Number(match[1]));
assert.equal(plannedMinutes.reduce((total, value) => total + value, 0), 150,
  "第 01 课步骤用时合计必须与 150 分钟标称一致");

assert.ok(lesson.includes("UnsafeTaskStatisticsAcceptance"), "讲义缺少真实 TASK 验收类名");
assert.ok(!lesson.includes("*Lesson01*Acceptance"), "讲义仍包含无法匹配的旧测试命令");
assert.equal(count(task, /throw new UnsupportedOperationException\("TODO lesson01:/g), 2,
  "TASK 应保留两个未完成 TODO");
assert.ok(acceptance.includes("daemon(true)"), "TASK 验收 Worker 应为 daemon，避免错误作业拖死 JVM");
assert.ok(!javaFiles.includes("Thread.sleep"), "第 01 课不应依赖 Thread.sleep 猜测时序");
assert.ok(lostUpdateDemo.includes("localSnapshot"), "丢失更新 DEMO 应使用线程私有快照语义");
assert.ok(!lostUpdateDemo.includes("stackLocalCopy"), "源码不应把局部值的物理位置写死为线程栈");
assert.ok(java21Switch.includes("juc_is_java21"), "JDK 切换脚本必须校验真实主版本，不能接受 macOS 回退值");

assertInOrder(
  app,
  ["A · READ", "B · READ", "A · ADD", "B · ADD", "A · WRITE", "B · WRITE"],
  "丢失更新动画",
);
assertInOrder(
  app,
  ["A · LOCK 1", "B · LOCK 2", "A · WAIT 2", "B · WAIT 1"],
  "死锁动画",
);
assert.equal(count(html, /class="lesson-chip/g), 8, "网页必须展示 8 课导航");
assert.equal(count(html, /data-todo=/g), 8, "网页 Todo 必须与讲义的 8 项结束条件一致");
assert.ok(css.includes("minmax(0, 65fr) minmax(360px, 35fr)"), "桌面端必须使用约 65/35 分屏");
assert.ok(html.includes("id=\"theme-toggle\""), "网页缺少配色切换");
assert.ok(app.includes("juc-v3-lesson01-todos"), "Todo 未使用独立持久化键");
assert.ok(app.includes("lesson01.md"), "网页未直接读取第 01 课 Markdown");
assert.ok(app.includes("lesson01-review.md"), "网页未直接读取第 01 课学习记录 Markdown");
assert.ok(app.includes("markdown-table-scroll"), "Markdown 表格缺少窄屏横向滚动容器");
assert.ok(app.includes('operation: "read"') && app.includes('operation: "write"'),
  "移动端数据流必须能区分读入与写回方向");
assert.ok(html.includes("动画展示一条合法交错"), "网页缺少动画与真实调度的边界说明");
assert.ok(html.includes("任务注册表锁") && html.includes("完成统计锁"),
  "网页死锁对象名称必须与 Java DEMO 一致");
assert.ok(server.includes("JUC_WEB_HOST") && server.includes("JUC_WEB_PORT"),
  "网页服务环境变量必须使用项目专属前缀");

for (const path of requiredFiles.filter((value) => value.endsWith(".java"))) {
  assert.ok(app.includes(path), `网页源码清单缺少 ${path}`);
  assert.ok(server.includes(path), `网页服务源码清单缺少 ${path}`);
}

for (const markdown of [lesson, review]) {
  assert.equal(count(markdown, /^```/gm) % 2, 0, "Markdown 代码围栏必须成对");
}

console.log("第 01 课结构校验通过：代码、讲义、复盘、动画与源码联动文件齐全。");
