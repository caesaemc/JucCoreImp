import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  assert.match(html, /<title>JUC 六课源码实战<\/title>/i);
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
  assert.match(html, /data-testid="lesson-markdown-01"/);
  assert.match(html, /完整 Markdown 讲义/);
  assert.match(html, /正确学习路径/);
  assert.match(html, /网页正文与仓库讲义来自同一个文件/);
  assert.match(html, /只做这 5 件事/);
  assert.match(html, /data-testid="learning-checklist-01"/);
  assert.match(html, /讲义 · 动画 · 源码统一 6 课/);
  assert.match(html, /主源码 course01/);
  assert.match(html, /com\/caesaemc\/juc\/course01\/SharedCounterLab\.java/);
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

test("六份 Markdown 是网页讲义的唯一内容源，并在构建前自动同步", async () => {
  const [generated, workspace, packageJson] = await Promise.all([
    readFile(
      new URL("../app/lesson-notes.generated.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/lesson-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  const expectedTitles = [
    "共享数据与 Java 内存模型",
    "volatile、synchronized 与安全发布",
    "线程协作、CAS、锁与同步器",
    "并发集合、队列与生产消费",
    "线程池、异步任务与虚拟线程",
    "可靠性、排障与综合项目",
  ];

  for (let index = 0; index < expectedTitles.length; index += 1) {
    const number = String(index + 1).padStart(2, "0");
    const markdown = await readFile(
      new URL(
        `../../docs/learning-journal/lesson-${number}.md`,
        import.meta.url,
      ),
      "utf8",
    );
    const hash = createHash("sha256").update(markdown).digest("hex");

    assert.match(markdown, new RegExp(expectedTitles[index]));
    assert.ok(
      occurrences(markdown, /^## /gm) >= 8,
      `lesson-${number}.md 应包含完整讲义结构`,
    );
    assert.match(generated, new RegExp(`"number": "${number}"`));
    assert.match(generated, new RegExp(`"contentHash": "${hash}"`));
  }

  assert.equal(occurrences(generated, /"contentHash": "[a-f0-9]{64}"/g), 6);
  assert.match(workspace, /getLessonNote\(lesson\.number\)/);
  assert.match(workspace, /<LessonMarkdown note=\{note\} \/>/);
  assert.match(workspace, /markdown-toc/);
  assert.match(packageJson, /"prebuild": "npm run generate:content"/);
  assert.match(packageJson, /"predev": "npm run generate:content"/);
  assert.match(packageJson, /generate:notes.*generate:sources/);
});

test("后五课分别使用真实结构的可播放动画，而不是复用通用流程图", async () => {
  const [runtimeLab, workspace] = await Promise.all([
    readFile(
      new URL("../app/lesson-runtime-lab.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/lesson-workspace.tsx", import.meta.url), "utf8"),
  ]);

  const expectedLabs = [
    ["PUBLICATION_STEPS", "AQS_STEPS", 6],
    ["AQS_STEPS", "PIPELINE_STEPS", 7],
    ["PIPELINE_STEPS", "POOL_STEPS", 7],
    ["POOL_STEPS", "RELIABILITY_STEPS", 7],
    ["RELIABILITY_STEPS", "function OutcomeCell", 7],
  ];

  for (const [start, end, count] of expectedLabs) {
    const steps = between(runtimeLab, `const ${start}`, `${end}`);
    assert.equal(
      occurrences(steps, /\n\s+short: "/g),
      count,
      `${start} 应包含 ${count} 个动画步骤`,
    );
  }

  assert.match(runtimeLab, /不可变配置的安全发布/);
  assert.match(runtimeLab, /Mutex \/ AQS 的一次锁交接/);
  assert.match(runtimeLab, /并发 Map 与有界队列的数据通道/);
  assert.match(runtimeLab, /ThreadPoolExecutor 的四条接纳路径/);
  assert.match(runtimeLab, /有边界的多下游聚合请求/);
  assert.match(runtimeLab, /system-data-packet/);
  assert.match(runtimeLab, /prefers-reduced-motion|动画控制/);
  assert.match(workspace, /LessonRuntimeLab/);
  assert.doesNotMatch(workspace, /className="memory-region"/);
});

test("学习入口、源码包和运行类统一为 6 课", async () => {
  const [fastData, lessonOne] = await Promise.all([
    readFile(
      new URL("../app/fast-course-data.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/lesson-one-simple-data.ts", import.meta.url),
      "utf8",
    ),
  ]);
  const tabs = between(
    fastData,
    "export const fastCourseTabs",
    "function baseLesson",
  );
  const lessons = between(
    fastData,
    "export const fastLessons",
    "export function getFastLessonDetail",
  );

  assert.equal(occurrences(tabs, /\n\s+number: "/g), 6);
  assert.equal(occurrences(lessons, /\n\s+lesson0[1-6],/g), 6);
  for (let index = 1; index <= 6; index += 1) {
    const number = String(index).padStart(2, "0");
    assert.match(fastData, new RegExp(`主源码 course${number}`));
    assert.match(
      number === "01" ? lessonOne : fastData,
      new RegExp(`com\\.caesaemc\\.juc\\.course${number}\\.Course${number}Application`),
    );
  }
  assert.doesNotMatch(fastData, /合并原第|sourceKeys: \["0[3-9]-|sourceKeys: \["1[0-6]-/);
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
  assert.equal(snippets.length, 24);

  for (const snippet of snippets) {
    assert.match(
      snippet.path,
      /^src\/main\/java\/com\/caesaemc\/juc\/course0[1-6]\//,
    );
    assert.doesNotMatch(snippet.path, /\/lesson\d+\//);
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
