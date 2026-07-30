import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(webRoot, "..");
const notesDirectory = path.join(
  repositoryRoot,
  "docs",
  "learning-journal",
);
const outputPath = path.join(webRoot, "app", "lesson-notes.generated.ts");
const githubRoot = "https://github.com/caesaemc/JucCoreImp/blob/main";
const lessonNumbers = ["01", "02", "03", "04", "05", "06"];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeLink(href, sourceDirectory) {
  if (/^(https?:|mailto:)/i.test(href) || href.startsWith("#")) {
    return href;
  }

  const [filePart, hash = ""] = href.split("#", 2);
  const absolutePath = path.resolve(sourceDirectory, filePart);
  const relativePath = path
    .relative(repositoryRoot, absolutePath)
    .split(path.sep)
    .join("/");

  if (relativePath.startsWith("../")) {
    return "#";
  }

  return `${githubRoot}/${relativePath}${hash ? `#${hash}` : ""}`;
}

function renderInline(value, sourceDirectory) {
  const placeholders = [];
  const hold = (html) => {
    const token = `\u0000INLINE_${placeholders.length}\u0000`;
    placeholders.push(html);
    return token;
  };

  let prepared = value.replace(/`([^`]+)`/g, (_, code) =>
    hold(`<code>${escapeHtml(code)}</code>`),
  );

  prepared = prepared.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, label, href) => {
      const normalizedHref = normalizeLink(href, sourceDirectory);
      const external = /^https?:/i.test(normalizedHref);
      const attributes = external
        ? ' target="_blank" rel="noreferrer"'
        : "";
      return hold(
        `<a href="${escapeHtml(normalizedHref)}"${attributes}>${escapeHtml(label)}</a>`,
      );
    },
  );

  let rendered = escapeHtml(prepared)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  placeholders.forEach((html, index) => {
    rendered = rendered.replace(`\u0000INLINE_${index}\u0000`, html);
  });
  return rendered;
}

function isSpecialLine(line) {
  return (
    /^#{1,3}\s+/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^---+$/.test(line)
  );
}

function renderMarkdown(markdown, lessonNumber, sourcePath) {
  const sourceDirectory = path.dirname(sourcePath);
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const headings = [];
  const html = [];
  let headingIndex = 0;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      const language = fence[1] || "text";
      const code = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      html.push(
        `<pre data-language="${escapeHtml(language)}"><code>${escapeHtml(code.join("\n"))}</code></pre>`,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const label = heading[2].replace(/`([^`]+)`/g, "$1");
      const id =
        level === 1
          ? `lesson-${lessonNumber}-document-title`
          : `lesson-${lessonNumber}-section-${++headingIndex}`;
      if (level === 2) {
        headings.push({ id, label });
      }
      html.push(
        `<h${level} id="${id}">${renderInline(heading[2], sourceDirectory)}</h${level}>`,
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      const quote = quoteLines
        .map((item) =>
          item
            ? renderInline(item, sourceDirectory)
            : '<span class="md-quote-break" aria-hidden="true"></span>',
        )
        .join("");
      html.push(`<blockquote>${quote}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        const item = lines[index].replace(/^[-*]\s+/, "");
        const task = item.match(/^\[([ xX])\]\s+(.+)$/);
        if (task) {
          const checked = task[1].toLowerCase() === "x";
          items.push(
            `<li class="md-task${checked ? " is-checked" : ""}"><span class="md-checkbox" aria-hidden="true">${checked ? "✓" : ""}</span>${renderInline(task[2], sourceDirectory)}</li>`,
          );
        } else {
          items.push(`<li>${renderInline(item, sourceDirectory)}</li>`);
        }
        index += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\d+\.\s+/, "");
        items.push(`<li>${renderInline(item, sourceDirectory)}</li>`);
        index += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (/^---+$/.test(line)) {
      html.push("<hr>");
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isSpecialLine(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(
      `<p>${renderInline(paragraph.join(" "), sourceDirectory)}</p>`,
    );
  }

  return {
    html: html.join("\n"),
    headings,
  };
}

const notes = {};

for (const lessonNumber of lessonNumbers) {
  const sourcePath = path.join(
    notesDirectory,
    `lesson-${lessonNumber}.md`,
  );
  const markdown = await readFile(sourcePath, "utf8");
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (!titleMatch) {
    throw new Error(`lesson-${lessonNumber}.md 缺少一级标题`);
  }

  const rendered = renderMarkdown(markdown, lessonNumber, sourcePath);
  const relativeSourcePath = path
    .relative(repositoryRoot, sourcePath)
    .split(path.sep)
    .join("/");

  notes[lessonNumber] = {
    number: lessonNumber,
    title: titleMatch[1],
    sourcePath: relativeSourcePath,
    sourceUrl: `${githubRoot}/${relativeSourcePath}`,
    contentHash: createHash("sha256").update(markdown).digest("hex"),
    headings: rendered.headings,
    html: rendered.html,
  };
}

const generated = `/* 此文件由 scripts/generate-lesson-notes.mjs 自动生成，请修改 docs/learning-journal/lesson-XX.md。 */

export type LessonNoteHeading = {
  readonly id: string;
  readonly label: string;
};

export type LessonNote = {
  readonly number: string;
  readonly title: string;
  readonly sourcePath: string;
  readonly sourceUrl: string;
  readonly contentHash: string;
  readonly headings: readonly LessonNoteHeading[];
  readonly html: string;
};

export const lessonNotes = ${JSON.stringify(notes, null, 2)} as const satisfies Record<string, LessonNote>;

export function getLessonNote(number: string): LessonNote | undefined {
  return lessonNotes[number as keyof typeof lessonNotes];
}
`;

await writeFile(outputPath, generated, "utf8");
console.log(
  `已生成 ${lessonNumbers.length} 份网页讲义：${path.relative(repositoryRoot, outputPath)}`,
);
