import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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

function lessonSection(courseData, number, nextNumber) {
  const marker = `\n    number: "${number}",\n    stage:`;
  const start = courseData.indexOf(marker);
  assert.notEqual(start, -1, `缺少第 ${number} 课详情`);

  if (!nextNumber) {
    return courseData.slice(start);
  }
  const nextMarker = `\n    number: "${nextNumber}",\n    stage:`;
  const end = courseData.indexOf(nextMarker, start + marker.length);
  assert.notEqual(end, -1, `无法确定第 ${number} 课结束位置`);
  return courseData.slice(start, end);
}

function between(value, startMarker, endMarker) {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `无法提取 ${startMarker} → ${endMarker}`);
  return value.slice(start, end);
}

test("server-renders the 16-lesson course dock and lesson one", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>JUC Core Lab · 16 课交互学习站<\/title>/i,
  );
  assert.match(html, /aria-label="16 课课程切换"/);
  assert.match(html, /aria-label="第 01 课：并发问题与 Java 内存模型"/);
  assert.match(html, /aria-label="第 16 课：高并发多下游聚合服务"/);
  assert.match(html, /确定性丢失更新推演/);
  assert.match(html, /happens-before 数据流/);
  assert.match(html, /DeterministicLostUpdateDemo\.java/);
  assert.match(html, /data-testid="learning-checklist"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("every lesson 02-16 has the same complete learning contract", async () => {
  const courseData = await readFile(
    new URL("../app/course-data.ts", import.meta.url),
    "utf8",
  );
  const numbers = Array.from({ length: 15 }, (_, index) =>
    String(index + 2).padStart(2, "0"),
  );

  numbers.forEach((number, index) => {
    const section = lessonSection(courseData, number, numbers[index + 1]);
    const concepts = between(section, "concepts: [", "flowTitle:");
    const flow = between(section, "flow: [", "zones: [");
    const zones = between(section, "zones: [", "routes: [");
    const routes = between(section, "routes: [", "sourceKeys:");
    const interview = between(section, "interview: [", "finish:");
    const sourceKeys = section.match(/sourceKeys:\s*\[([^\]]+)\]/)?.[1] ?? "";

    assert.equal(
      occurrences(concepts, /\n\s+code:/g),
      3,
      `第 ${number} 课必须有 3 个核心概念`,
    );
    assert.equal(
      occurrences(flow, /\n\s+label:/g),
      6,
      `第 ${number} 课必须有 6 个流程步骤`,
    );
    assert.equal(
      occurrences(zones, /\n\s+code:/g),
      4,
      `第 ${number} 课必须有 4 个数据分布区域`,
    );
    assert.equal(
      occurrences(routes, /\n\s+data:/g),
      4,
      `第 ${number} 课必须有 4 条数据路由`,
    );
    assert.ok(
      occurrences(sourceKeys, /"[0-9]{2}-[^"]+"/g) >= 3,
      `第 ${number} 课必须有至少 3 份源码片段`,
    );
    assert.match(section, /exercise:\s*\{/);
    assert.match(section, /testCommand:/);
    assert.equal(
      occurrences(interview, /\n\s+question:/g),
      5,
      `第 ${number} 课必须有 5 道面试题`,
    );
  });
});

test("generated source snippets exactly match the Java repository", async () => {
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

test("keeps per-lesson local progress and removes starter-only assets", async () => {
  const [page, lessonOne, workspace, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lesson-one.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lesson-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /searchParams\.set\("lesson"/);
  assert.match(page, /courseTabs/);
  assert.match(lessonOne, /juc-course\.lesson-01\.todos\.v1/);
  assert.match(workspace, /juc-course\.lesson-\$\{lesson\.number\}\.todos\.v1/);
  assert.match(workspace, /juc-progress-update/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(packageJson, /generate:sources/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("../app/_sites-preview", templateRoot)),
  );
});
