import type { LessonNote } from "./lesson-notes.generated";

export default function LessonMarkdown({ note }: { note: LessonNote }) {
  return (
    <article
      className="lesson-markdown"
      aria-label={`${note.title}完整 Markdown 讲义`}
      data-testid={`lesson-markdown-${note.number}`}
    >
      <header className="markdown-source-bar">
        <div>
          <span>完整 Markdown 讲义</span>
          <strong>网页正文与仓库讲义来自同一个文件</strong>
        </div>
        <a href={note.sourceUrl} target="_blank" rel="noreferrer">
          查看 MD 源文件 ↗
        </a>
      </header>
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: note.html }}
      />
    </article>
  );
}
