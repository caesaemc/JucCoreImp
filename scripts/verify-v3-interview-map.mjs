import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mappingUrl = new URL("../docs/v3/INTERVIEW_MAPPING.md", import.meta.url);
const markdown = await readFile(mappingUrl, "utf8");

const expectedCounts = new Map([
  ["01", 6],
  ["02", 14],
  ["03", 6],
  ["04", 10],
  ["05", 12],
  ["06", 5],
  ["07", 13],
  ["08", 2],
]);

const actualCounts = new Map(
  [...expectedCounts.keys()].map((lesson) => [lesson, 0]),
);
const ids = [];
let activeLesson;

for (const line of markdown.split("\n")) {
  const lessonHeading = line.match(/^## 第 (0[1-8]) 课：/);
  if (lessonHeading) {
    activeLesson = lessonHeading[1];
    continue;
  }

  if (line.startsWith("## ")) {
    activeLesson = undefined;
    continue;
  }

  const questionRow = line.match(/^\| Q(\d{2}) \|/);
  if (!questionRow || !activeLesson) {
    continue;
  }

  ids.push(Number(questionRow[1]));
  actualCounts.set(activeLesson, actualCounts.get(activeLesson) + 1);
}

assert.equal(ids.length, 68, "必须映射全部 68 道来源题");
assert.equal(new Set(ids).size, 68, "来源题 ID 不能重复");
assert.deepEqual(
  [...ids].sort((left, right) => left - right),
  Array.from({ length: 68 }, (_, index) => index + 1),
  "来源题 ID 必须完整覆盖 Q01～Q68",
);

for (const [lesson, expected] of expectedCounts) {
  assert.equal(
    actualCounts.get(lesson),
    expected,
    `第 ${lesson} 课题数应为 ${expected}`,
  );
}

console.log(
  `V3 面试矩阵校验通过：${ids.length} 题，${actualCounts.size} 课，ID 无遗漏。`,
);
