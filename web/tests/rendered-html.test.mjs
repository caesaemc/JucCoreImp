import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const webRoot = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function occurrences(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function between(value, startMarker, endMarker) {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `无法提取 ${startMarker} → ${endMarker}`);
  return value.slice(start, end);
}

test("默认打开带运行时内存动画的第 01 课", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>JUC 快速面试课 · 6 课精简版<\/title>/i);
  assert.match(html, /<html[^>]+data-theme="light"/i);
  assert.match(html, /aria-label="6 课快速面试课程切换"/);
  assert.match(html, /aria-label="第 01 课：共享数据与 Java 内存模型"/);
  assert.match(html, /aria-label="第 06 课：可靠性、排障与综合项目"/);
  assert.match(html, /共享数据与 Java 内存模型/);
  assert.match(html, /JVM 进程内存（教学简化）/);
  assert.match(html, /类元数据区 \/ Metaspace/);
  assert.match(html, /UnsafeCounter @C1/);
  assert.match(html, /线程 A 的栈/);
  assert.match(html, /操作数栈 · 读到的旧值/);
  assert.match(html, /丢失更新的一种真实交错 · STEP/);
  assert.match(html, />播放</);
  assert.match(html, /一页讲义/);
  assert.match(html, /只做这 5 件事/);
  assert.match(html, /data-testid="learning-checklist-01"/);
  assert.doesNotMatch(html, /自动播放|DATA ROUTING TABLE|16 LESSONS/);
});

test("第一课动画完整覆盖创建、读取、计算、写回和覆盖", async () => {
  const memoryLab = await readFile(
    new URL("../app/lesson-one-memory-lab.tsx", import.meta.url),
    "utf8",
  );
  const steps = between(
    memoryLab,
    "const MEMORY_STEPS",
    "function fieldClass",
  );

  assert.equal(occurrences(steps, /\n\s+short: "/g), 7);
  assert.match(steps, /short: "创建对象"/);
  assert.match(steps, /short: "A 读取"/);
  assert.match(steps, /short: "B 读取"/);
  assert.match(steps, /short: "A 写回"/);
  assert.match(steps, /short: "B 覆盖"/);
  assert.match(memoryLab, /data-packet/);
  assert.match(memoryLab, /正确结果/);
  assert.match(memoryLab, /丢失更新/);
});

test("学习入口只有 6 课，并明确记录原 16 课合并关系", async () => {
  const fastData = await readFile(
    new URL("../app/fast-course-data.ts", import.meta.url),
    "utf8",
  );
  const tabs = between(
    fastData,
    "export const fastCourseTabs",
    "function legacy",
  );
  const lessons = between(
    fastData,
    "export const fastLessons",
    "export function getFastLessonDetail",
  );

  assert.equal(occurrences(tabs, /\n\s+number: "/g), 6);
  assert.equal(occurrences(lessons, /\n\s+lesson0[1-6],/g), 6);
  assert.match(fastData, /合并原第 03～06 课/);
  assert.match(fastData, /合并原第 09～13 课/);
  assert.match(fastData, /合并原第 14～16 课/);
});

test("生成的源码片段与 Java 文件完全一致", async () => {
  const generated = await readFile(
    new URL("../app/source-snippets.generated.ts", import.meta.url),
    "utf8",
  );
  const startMarker = "export const sourceSnippets = ";
  const endMarker = " as const satisfies readonly SourceSnippet[];";
  const start = generated.indexOf(startMarker);
  const end = generated.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start);

  const snippets = JSON.parse(
    generated.slice(start + startMarker.length, end),
  );
  assert.equal(snippets.length, 46);

  for (const snippet of snippets) {
    const source = await readFile(
      new URL(`../../${snippet.path}`, import.meta.url),
      "utf8",
    );
    const expected = source
      .replace(/\r\n/g, "\n")
      .split("\n")
      .slice(snippet.startLine - 1, snippet.endLine)
      .join("\n");
    assert.equal(
      snippet.code,
      expected,
      `${snippet.key} 与真实 Java 源码不一致，请重新生成`,
    );
  }
});

test("每课只有 5 项 Todo，进度和主题保存在本地", async () => {
  const [page, workspace, layout, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lesson-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  const todoBlock = between(
    workspace,
    "const TODO_ITEMS",
    "function explainCodeLine",
  );
  assert.equal(occurrences(todoBlock, /\n\s+id: "/g), 5);
  assert.match(page, /const TODO_TOTAL = 5/);
  assert.match(page, /searchParams\.set\("lesson"/);
  assert.match(workspace, /todos\.v2/);
  assert.match(workspace, /juc-progress-update/);
  assert.match(page, /juc-course\.theme\.v1/);
  assert.match(layout, /data-theme="light"/);
  assert.match(layout, /og-memory-lab\.png/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /\.simple-todo/);
  assert.match(styles, /\.simple-guide/);
  assert.match(packageJson, /generate:sources/);
  assert.doesNotMatch(workspace, /自动播放|flowStep|DATA ROUTING TABLE/);
  await assert.rejects(access(new URL("../app/lesson-one.tsx", webRoot)));
});
