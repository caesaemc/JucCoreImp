"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getFastLessonSources,
  type FastLesson,
} from "./fast-course-data";
import LessonMarkdown from "./lesson-markdown";
import { getLessonNote } from "./lesson-notes.generated";
import LessonOneMemoryLab from "./lesson-one-memory-lab";
import LessonRuntimeLab from "./lesson-runtime-lab";

type TodoItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
};

const TODO_ITEMS: TodoItem[] = [
  {
    id: "guide",
    label: "读完一页讲义",
    detail: "直接在网页阅读完整 Markdown 正文",
    href: "#lesson-guide",
  },
  {
    id: "memory",
    label: "看懂内存图",
    detail: "能指出数据放哪、从哪到哪",
    href: "#memory-picture",
  },
  {
    id: "source",
    label: "读代码并运行",
    detail: "先看注释，再复制命令运行",
    href: "#source-code",
  },
  {
    id: "exercise",
    label: "完成一个练习",
    detail: "用测试证明修改有效",
    href: "#lesson-exercise",
  },
  {
    id: "interview",
    label: "口述 3 道题",
    detail: "每题 30～60 秒，说结论和原因",
    href: "#interview-check",
  },
];

function explainCodeLine(line: string): string | undefined {
  const value = line.trim();
  if (!value || value.startsWith("//") || value.startsWith("*")) {
    return undefined;
  }
  if (value.includes("volatile")) {
    return "这是线程之间交接数据的入口。";
  }
  if (value.includes("synchronized")) {
    return "进入这里前要拿同一把锁，一次只进一个线程。";
  }
  if (value.includes("new Settings")) {
    return "先把一个完整的新对象造好。";
  }
  if (/current\s*=\s*settings/.test(value) || /instance\s*=\s*local/.test(value)) {
    return "再一次性把完整对象交给其他线程。";
  }
  if (value.includes("++")) {
    return "注意：++ 包含读取、加一、写回，不是一步。";
  }
  if (value.includes("compareAndSet")) {
    return "旧值没变才写入；失败就重新读再试。";
  }
  if (value.includes(".interrupt()")) {
    return "把停止请求发给目标线程。";
  }
  if (value.includes(".acquire(")) {
    return "先拿到一张许可，才能使用后面的资源。";
  }
  if (value.includes(".release(")) {
    return "用完归还许可，异常路径也不能漏。";
  }
  if (value.includes("return current")) {
    return "读线程从唯一的共享入口拿一次引用。";
  }
  return undefined;
}

export default function LessonWorkspace({ lesson }: { lesson: FastLesson }) {
  const sources = useMemo(() => getFastLessonSources(lesson), [lesson]);
  const note = getLessonNote(lesson.number);
  const storageKey = `juc-course.lesson-${lesson.number}.todos.v2`;
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [sourceKey, setSourceKey] = useState(sources[0]?.key ?? "");
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [copied, setCopied] = useState<"run" | "test" | null>(null);

  const activeSource =
    sources.find((source) => source.key === sourceKey) ?? sources[0];
  const progress = Math.round((completed.size / TODO_ITEMS.length) * 100);
  const runCommand = `mvn -q -DskipTests package\njava -cp target/classes ${lesson.runClass}`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        const values = saved ? JSON.parse(saved) : [];
        if (Array.isArray(values)) {
          setCompleted(
            new Set(
              values.filter((value): value is string =>
                TODO_ITEMS.some((item) => item.id === value),
              ),
            ),
          );
        }
      } catch {
        // 本地记录坏了就从空清单开始，不影响课程内容。
      } finally {
        setHydrated(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...completed]));
    } catch {
      // 浏览器不允许本地存储时，当前页面内仍可勾选。
    }
    window.dispatchEvent(
      new CustomEvent("juc-progress-update", {
        detail: {
          lesson: lesson.number,
          completed: completed.size,
          total: TODO_ITEMS.length,
        },
      }),
    );
  }, [completed, hydrated, lesson.number, storageKey]);

  function toggleTodo(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function copyText(kind: "run" | "test", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <main className={`simple-lesson accent-${lesson.accent}`} id="lesson-top">
      <header className="simple-intro">
        <div>
          <span className="simple-kicker">第 {lesson.number} 课 · 快速面试版</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.lead}</p>
        </div>
        <div className="simple-intro-meta">
          <span>{lesson.duration}</span>
          <span>{lesson.originLessons}</span>
          <strong>{progress}%</strong>
        </div>
      </header>

      <div className="simple-workspace">
        <aside
          className="simple-todo"
          aria-label={`第 ${lesson.number} 课 Todo`}
          data-testid={`learning-checklist-${lesson.number}`}
        >
          <header>
            <div>
              <span>TODO</span>
              <h2>只做这 5 件事</h2>
            </div>
            <strong>
              {completed.size}/{TODO_ITEMS.length}
            </strong>
          </header>
          <div className="simple-progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="simple-todo-list">
            {TODO_ITEMS.map((item, index) => {
              const done = completed.has(item.id);
              return (
                <label className={done ? "is-done" : ""} key={item.id}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleTodo(item.id)}
                  />
                  <span className="simple-check">
                    {done ? "✓" : index + 1}
                  </span>
                  <span>
                    <a href={item.href}>{item.label}</a>
                    <small>{item.detail}</small>
                  </span>
                </label>
              );
            })}
          </div>
          <button
            className="simple-reset"
            type="button"
            onClick={() => setCompleted(new Set())}
          >
            清空本课勾选
          </button>
        </aside>

        <div className="simple-main-column">
          {note ? (
            <section className="simple-panel markdown-panel" id="lesson-guide">
              <div className="simple-section-title">
                <span>MD</span>
                <div>
                  <h2>先读完整课程讲义</h2>
                  <p>
                    下面直接渲染本课 Markdown；讲义、学习记录和后续有价值问答只维护这一份。
                  </p>
                </div>
              </div>
              <LessonMarkdown note={note} />
            </section>
          ) : null}

          <section className="simple-panel memory-panel" id="memory-picture">
            <div className="simple-section-title">
              <span>01</span>
              <div>
                <h2>
                  {lesson.number === "01"
                    ? "运行一次 value++，看数据怎样变化"
                    : "播放一次真实流程，看数据怎样流动"}
                </h2>
                <p>
                  {lesson.number === "01"
                    ? "类元数据只保存结构，value 存在堆对象中；线程栈只暂存本次计算用到的旧值和新值。"
                    : "虚线框区分线程栈和共享堆，实线框表示对象或内部结构，活动数据球表示本步真正发生的读取、写入或唤醒。"}
                </p>
              </div>
            </div>

            {lesson.number === "01" ? (
              <LessonOneMemoryLab />
            ) : (
              <LessonRuntimeLab lessonNumber={lesson.number} />
            )}
          </section>

          <section className="simple-panel source-panel" id="source-code">
            <div className="simple-section-title">
              <span>02</span>
              <div>
                <h2>再看真实代码</h2>
                <p>只看高亮行和旁边的人话解释；理解后再打开完整文件。</p>
              </div>
            </div>

            <div className="simple-source-tabs" role="tablist">
              {sources.map((source) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={source.key === activeSource.key}
                  className={source.key === activeSource.key ? "is-active" : ""}
                  onClick={() => setSourceKey(source.key)}
                  key={source.key}
                >
                  <strong>{source.tab}</strong>
                  <small>{source.filename}</small>
                </button>
              ))}
            </div>

            {activeSource ? (
              <div className="simple-code">
                <header>
                  <span>{activeSource.path}</span>
                  <a href={activeSource.link} target="_blank" rel="noreferrer">
                    打开完整源码 ↗
                  </a>
                </header>
                <div className="simple-code-lines">
                  {activeSource.code.split("\n").map((line, index) => {
                    const lineNumber = activeSource.startLine + index;
                    const highlighted =
                      activeSource.highlights.includes(lineNumber);
                    const explanation = highlighted
                      ? explainCodeLine(line)
                      : undefined;
                    return (
                      <div
                        className={`simple-code-line ${
                          highlighted ? "is-highlighted" : ""
                        }`}
                        key={`${activeSource.key}-${lineNumber}`}
                      >
                        <span>{lineNumber}</span>
                        <code>{line || " "}</code>
                        {explanation ? <em>{explanation}</em> : null}
                      </div>
                    );
                  })}
                </div>
                <footer>{activeSource.note}</footer>
              </div>
            ) : null}

            <div className="simple-run">
              <div>
                <strong>运行本课示例</strong>
                <small>在项目根目录执行</small>
              </div>
              <pre>
                <code>{runCommand}</code>
              </pre>
              <button type="button" onClick={() => copyText("run", runCommand)}>
                {copied === "run" ? "已复制 ✓" : "复制命令"}
              </button>
            </div>
          </section>

          <section className="simple-panel exercise-panel" id="lesson-exercise">
            <div className="simple-section-title">
              <span>03</span>
              <div>
                <h2>动手改一个地方</h2>
                <p>练习不求多，只要求你能解释为什么改完是安全的。</p>
              </div>
            </div>
            <div className="simple-exercise">
              <div>
                <span>练习</span>
                <h3>{lesson.exercise.title}</h3>
                <p>{lesson.exercise.summary}</p>
                <ul>
                  {lesson.exercise.requirements.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="simple-test-command">
                <small>验收命令</small>
                <code>{lesson.exercise.testCommand}</code>
                <button
                  type="button"
                  onClick={() =>
                    copyText("test", lesson.exercise.testCommand)
                  }
                >
                  {copied === "test" ? "已复制 ✓" : "复制"}
                </button>
                <p>{lesson.exercise.expected}</p>
              </div>
            </div>
          </section>

          <section className="simple-panel interview-panel" id="interview-check">
            <div className="simple-section-title">
              <span>04</span>
              <div>
                <h2>最后口述 3 道题</h2>
                <p>先自己回答，再点开参考答案。每题控制在一分钟内。</p>
              </div>
            </div>
            <div className="simple-questions">
              {lesson.interview.slice(0, 3).map((item, index) => {
                const open = openQuestion === index;
                return (
                  <article className={open ? "is-open" : ""} key={item.question}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenQuestion(open ? null : index)}
                    >
                      <span>{index + 1}</span>
                      <strong>{item.question}</strong>
                      <b>{open ? "−" : "+"}</b>
                    </button>
                    {open ? <p>{item.answer}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="simple-guide" id="lesson-navigation">
          <header>
            <span>讲义目录</span>
            <h2>正文就在当前网页</h2>
          </header>

          <p className="guide-hook">
            不需要再打开本地 Markdown。点击目录可在本页正文中跳转。
          </p>

          {note ? (
            <nav
              className="markdown-toc"
              aria-label={`第 ${lesson.number} 课 Markdown 目录`}
            >
              {note.headings.map((heading, index) => (
                <a href={`#${heading.id}`} key={heading.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{heading.label}</strong>
                </a>
              ))}
            </nav>
          ) : null}

          <div className="guide-rules">
            <strong>面试选型口诀</strong>
            <ul>
              {lesson.quickRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          <div className="guide-finish">
            <span>学完标准</span>
            <p>{lesson.finish}</p>
          </div>
        </aside>
      </div>

      <footer className="simple-footer">
        <span>JUC 快速面试课 · 共 6 课</span>
        <a
          href="https://github.com/caesaemc/JucCoreImp"
          target="_blank"
          rel="noreferrer"
        >
          GitHub 源码 ↗
        </a>
      </footer>
    </main>
  );
}
