"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  getLessonSources,
  lessonGithubUrl,
  stageLabels,
  type LessonDetail,
} from "./course-data";

type LessonWorkspaceProps = {
  lesson: LessonDetail;
};

function buildTasks(lesson: LessonDetail) {
  return [
    {
      id: "concepts",
      label: "建立核心概念地图",
      detail: `讲清 ${lesson.concepts.map((item) => item.title).join("、")}`,
      href: "#lesson-concepts",
    },
    {
      id: "flow",
      label: "逐步推演总体流程",
      detail: `完成 ${lesson.flow.length} 个状态转换并解释每条边`,
      href: "#lesson-flow",
    },
    {
      id: "placement",
      label: "定位数据分布",
      detail: "区分线程本地、共享状态、控制状态与资源容量",
      href: "#lesson-data",
    },
    {
      id: "routing",
      label: "画出数据流向",
      detail: "说明来源、通道、目标与并发保证",
      href: "#lesson-routes",
    },
    {
      id: "source",
      label: "精读真实源码",
      detail: `把结论对应到 ${lesson.sourceKeys.length} 份 Java 源码`,
      href: "#lesson-source",
    },
    {
      id: "run",
      label: "运行本课完整示例",
      detail: "先预测结果，再运行并解释输出",
      href: "#lesson-practice",
    },
    {
      id: "exercise",
      label: `完成${lesson.exercise.title}`,
      detail: "启用测试，用断言证明并发不变量",
      href: "#lesson-exercise",
    },
    {
      id: "interview",
      label: "完成面试口述验收",
      detail: "按结论、原理、边界、取舍和证据回答",
      href: "#lesson-interview",
    },
  ];
}

function toneForIndex(index: number) {
  return ["cyan", "amber", "green"][index % 3];
}

export default function LessonWorkspace({ lesson }: LessonWorkspaceProps) {
  const tasks = useMemo(() => buildTasks(lesson), [lesson]);
  const sources = useMemo(() => getLessonSources(lesson), [lesson]);
  const storageKey = `juc-course.lesson-${lesson.number}.todos.v1`;
  const runCommand = `mvn -q -DskipTests package
java -cp target/classes ${lesson.runClass}`;

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [flowStep, setFlowStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sourceKey, setSourceKey] = useState(lesson.sourceKeys[0]);
  const [revealedQuestion, setRevealedQuestion] = useState<number | null>(null);
  const [copied, setCopied] = useState<"run" | "test" | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const values = JSON.parse(saved);
          if (Array.isArray(values)) {
            setCompleted(
              new Set(
                values.filter((value): value is string =>
                  tasks.some((task) => task.id === value),
                ),
              ),
            );
          }
        }
      } catch {
        // 单课本地进度损坏时从空清单开始，不影响课程正文。
      } finally {
        setHydrated(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey, tasks]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify([...completed]));
    window.dispatchEvent(
      new CustomEvent("juc-progress-update", {
        detail: {
          lesson: lesson.number,
          completed: completed.size,
          total: tasks.length,
        },
      }),
    );
  }, [completed, hydrated, lesson.number, storageKey, tasks.length]);

  useEffect(() => {
    if (!playing || flowStep >= lesson.flow.length - 1) {
      return;
    }
    const timer = window.setTimeout(() => {
      setFlowStep((current) => Math.min(current + 1, lesson.flow.length - 1));
      if (flowStep === lesson.flow.length - 2) {
        setPlaying(false);
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [flowStep, lesson.flow.length, playing]);

  const progress = Math.round((completed.size / tasks.length) * 100);
  const activeFlow = lesson.flow[flowStep];
  const activeSource =
    sources.find((source) => source.key === sourceKey) ?? sources[0];
  const activeStageLabel = stageLabels[lesson.stage - 1];

  function toggleTask(id: string) {
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
    window.setTimeout(() => setCopied(null), 1600);
  }

  const phaseCards = [
    {
      number: "01",
      title: "建立模型",
      description: lesson.concepts.map((concept) => concept.title).join(" · "),
      target: "#lesson-concepts",
    },
    {
      number: "02",
      title: "推演状态",
      description: lesson.flowTitle,
      target: "#lesson-flow",
    },
    {
      number: "03",
      title: "定位数据",
      description: "区分所有权、共享范围、容量与不变量",
      target: "#lesson-data",
    },
    {
      number: "04",
      title: "回到源码",
      description: `${sources.length} 份源码片段与真实行号`,
      target: "#lesson-source",
    },
    {
      number: "05",
      title: "形成证据",
      description: "运行、练习、测试与面试口述",
      target: "#lesson-practice",
    },
  ];

  return (
    <main className={`lesson-page accent-${lesson.accent}`}>
      <header className="site-header">
        <a className="brand" href="#lesson-top" aria-label="回到本课顶部">
          <span className="brand-mark">JC</span>
          <span>
            <strong>JUC CORE LAB</strong>
            <small>一套源码 · 十六个可推演系统</small>
          </span>
        </a>
        <nav className="top-nav" aria-label={`第 ${lesson.number} 课导航`}>
          <a href="#lesson-concepts">概念</a>
          <a href="#lesson-flow">流程</a>
          <a href="#lesson-data">数据</a>
          <a href="#lesson-source">源码</a>
          <a href="#lesson-interview">面试</a>
        </nav>
        <div
          className="header-progress"
          aria-label={`第 ${lesson.number} 课进度 ${progress}%`}
        >
          <span>LESSON {lesson.number} / 16</span>
          <div className="mini-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <b>{progress}%</b>
        </div>
      </header>

      <section className="lesson-hero" id="lesson-top">
        <div className="lesson-hero-copy">
          <p className="eyebrow">
            <span>JAVA 21</span>
            <span>LESSON {lesson.number}</span>
            <span>STAGE {String(lesson.stage).padStart(2, "0")}</span>
          </p>
          <p className="lesson-stage-name">{activeStageLabel}</p>
          <h1>{lesson.hook}</h1>
          <p className="lesson-title-line">{lesson.title}</p>
          <p className="hero-lead">{lesson.lead}</p>
          <div className="hero-actions">
            <a className="button primary" href="#lesson-flow">
              开始流程推演 <span aria-hidden="true">→</span>
            </a>
            <a className="button secondary" href="#lesson-todo">
              查看本课 TODO
            </a>
          </div>
          <div className="hero-facts" aria-label="本课内容统计">
            <div>
              <strong>{String(lesson.concepts.length).padStart(2, "0")}</strong>
              <span>核心模型</span>
            </div>
            <div>
              <strong>{String(lesson.flow.length).padStart(2, "0")}</strong>
              <span>流程步骤</span>
            </div>
            <div>
              <strong>{String(sources.length).padStart(2, "0")}</strong>
              <span>源码入口</span>
            </div>
            <div>
              <strong>08</strong>
              <span>完成项</span>
            </div>
          </div>
        </div>

        <div className="lesson-blueprint" aria-label={`${lesson.title} 总体流程`}>
          <div className="blueprint-header">
            <span>SYSTEM BLUEPRINT</span>
            <b>{lesson.english}</b>
          </div>
          <div className="blueprint-stack">
            {lesson.routes.slice(0, 3).map((route, index) => (
              <div className="blueprint-route" key={route.data}>
                <span className="route-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <small>{route.from}</small>
                  <strong>{route.data}</strong>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <small>{route.via}</small>
                  <strong>{route.to}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="blueprint-outcome">
            <span>COMPLETION GATE</span>
            <p>{lesson.outcome}</p>
          </div>
        </div>
      </section>

      <section className="course-map section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">LEARNING ROUTE</p>
            <h2>第 {lesson.number} 课总体流程</h2>
          </div>
          <p>
            按“模型 → 状态 → 数据 → 源码 → 证据”推进。先预测每一步，再查看解释与代码。
          </p>
        </div>
        <div className="phase-track">
          {phaseCards.map((phase, index) => (
            <a className="phase-card" href={phase.target} key={phase.number}>
              <span className="phase-number">{phase.number}</span>
              <small>STEP {String(index + 1).padStart(2, "0")}</small>
              <h3>{phase.title}</h3>
              <p>{phase.description}</p>
              <b aria-hidden="true">↘</b>
            </a>
          ))}
        </div>
      </section>

      <div className="learning-layout">
        <aside className="learning-sidebar" id="lesson-todo">
          <div className="todo-heading">
            <div>
              <p className="section-kicker">YOUR CHECKPOINTS</p>
              <h2>本课 TODO</h2>
            </div>
            <span>
              {completed.size}/{tasks.length}
            </span>
          </div>
          <div className="todo-progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div
            className="todo-list"
            data-testid={`learning-checklist-${lesson.number}`}
          >
            {tasks.map((task, index) => {
              const isDone = completed.has(task.id);
              return (
                <label
                  className={`todo-item ${isDone ? "is-complete" : ""}`}
                  key={task.id}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="custom-check" aria-hidden="true">
                    {isDone ? "✓" : String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="todo-copy">
                    <a href={task.href}>{task.label}</a>
                    <small>{task.detail}</small>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="todo-footer">
            <span>进度仅保存在当前浏览器</span>
            <button type="button" onClick={() => setCompleted(new Set())}>
              重置
            </button>
          </div>
          <div className="lesson-doc-links">
            <a
              href={lessonGithubUrl(lesson.number)}
              target="_blank"
              rel="noreferrer"
            >
              完整讲义 ↗
            </a>
            <a
              href={lessonGithubUrl(lesson.number, "EXERCISES.md")}
              target="_blank"
              rel="noreferrer"
            >
              练习说明 ↗
            </a>
            <a
              href={lessonGithubUrl(lesson.number, "INTERVIEW.md")}
              target="_blank"
              rel="noreferrer"
            >
              面试题库 ↗
            </a>
          </div>
        </aside>

        <div className="lesson-content">
          <section
            className="section-block generic-concepts"
            id="lesson-concepts"
          >
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">MENTAL MODEL</p>
                <h2>三个核心坐标</h2>
              </div>
              <p>
                先用模型确定保证和边界，再选择 API。每张卡都包含“它解决什么”和“它不解决什么”。
              </p>
            </div>
            <div className="generic-concept-grid">
              {lesson.concepts.map((concept, index) => (
                <article
                  className={`generic-concept tone-${toneForIndex(index)}`}
                  key={concept.code}
                >
                  <div className="concept-top">
                    <span>{concept.code}</span>
                    <small>{concept.subtitle}</small>
                  </div>
                  <h3>{concept.title}</h3>
                  <p>{concept.body}</p>
                  <footer>
                    <span>BOUNDARY</span>
                    {concept.boundary}
                  </footer>
                </article>
              ))}
            </div>
            <div className="lesson-thesis">
              <span>本课验收结论</span>
              <p>{lesson.outcome}</p>
            </div>
          </section>

          <section className="section-block generic-flow" id="lesson-flow">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">STATE FLOW LAB</p>
                <h2>{lesson.flowTitle}</h2>
              </div>
              <p>{lesson.flowLead}</p>
            </div>

            <div className="flow-lab">
              <div className="lab-toolbar">
                <div className="step-pills" aria-label="流程步骤">
                  {lesson.flow.map((step, index) => (
                    <button
                      type="button"
                      className={index === flowStep ? "is-active" : ""}
                      aria-pressed={index === flowStep}
                      onClick={() => {
                        setPlaying(false);
                        setFlowStep(index);
                      }}
                      key={step.label}
                    >
                      <span>{index}</span>
                      {step.label}
                    </button>
                  ))}
                </div>
                <div className="play-controls">
                  <button
                    type="button"
                    onClick={() => {
                      if (flowStep >= lesson.flow.length - 1) {
                        setFlowStep(0);
                      }
                      setPlaying((current) => !current);
                    }}
                  >
                    {playing ? "暂停" : "自动播放"}
                  </button>
                  <button
                    type="button"
                    disabled={flowStep === lesson.flow.length - 1}
                    onClick={() => {
                      setPlaying(false);
                      setFlowStep((current) =>
                        Math.min(current + 1, lesson.flow.length - 1),
                      );
                    }}
                  >
                    下一步 →
                  </button>
                </div>
              </div>

              <div
                className="state-flow-stage"
                style={{
                  "--flow-progress": `${Math.round(
                    ((flowStep + 1) / lesson.flow.length) * 100,
                  )}%`,
                } as CSSProperties}
              >
                <article className="state-node state-before">
                  <small>BEFORE / INPUT</small>
                  <strong>{activeFlow.before}</strong>
                  <span>步骤 {String(flowStep + 1).padStart(2, "0")}</span>
                </article>
                <div className="state-operation">
                  <span>{activeFlow.actor}</span>
                  <b>{activeFlow.action}</b>
                  <i aria-hidden="true">→</i>
                </div>
                <article className="state-node state-after">
                  <small>AFTER / OUTPUT</small>
                  <strong>{activeFlow.after}</strong>
                  <span>{activeFlow.signal}</span>
                </article>
              </div>

              <div className="flow-explanation">
                <span>{String(flowStep + 1).padStart(2, "0")}</span>
                <div>
                  <small>{activeFlow.label}</small>
                  <h3>{activeFlow.action}</h3>
                  <p>{activeFlow.detail}</p>
                </div>
                <b>{activeFlow.actor}</b>
              </div>

              <div className="flow-timeline" aria-label="全部流程概览">
                {lesson.flow.map((step, index) => (
                  <button
                    type="button"
                    className={index <= flowStep ? "is-reached" : ""}
                    onClick={() => {
                      setPlaying(false);
                      setFlowStep(index);
                    }}
                    key={`${step.label}-timeline`}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step.label}</strong>
                    <small>{step.signal}</small>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="section-block data-system" id="lesson-data">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">DATA PLACEMENT</p>
                <h2>数据分布与所有权</h2>
              </div>
              <p>
                并发错误常发生在“谁拥有这份状态”没有说清的时候。这里把共享范围、写入者与不变量摊开。
              </p>
            </div>
            <div className="data-zone-grid">
              {lesson.zones.map((zone) => (
                <article key={zone.code}>
                  <header>
                    <span>{zone.code}</span>
                    <div>
                      <small>{zone.kind}</small>
                      <strong>{zone.name}</strong>
                    </div>
                  </header>
                  <div className="zone-value">{zone.value}</div>
                  <dl>
                    <div>
                      <dt>OWNER</dt>
                      <dd>{zone.owner}</dd>
                    </div>
                    <div>
                      <dt>MUTATION</dt>
                      <dd>{zone.mutation}</dd>
                    </div>
                  </dl>
                  <footer>{zone.rule}</footer>
                </article>
              ))}
            </div>

            <div className="data-routing" id="lesson-routes">
              <div className="routing-header">
                <span>DATA ROUTING TABLE</span>
                <b>来源 → 同步通道 → 目标 → 保证</b>
              </div>
              <div className="routing-table">
                {lesson.routes.map((route, index) => (
                  <div className="routing-row" key={`${route.data}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{route.data}</strong>
                    <div>
                      <small>FROM</small>
                      {route.from}
                    </div>
                    <i>→</i>
                    <div>
                      <small>VIA</small>
                      {route.via}
                    </div>
                    <i>→</i>
                    <div>
                      <small>TO</small>
                      {route.to}
                    </div>
                    <em>{route.guarantee}</em>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-block source-section" id="lesson-source">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">SOURCE WALKTHROUGH</p>
                <h2>结论落回真实 Java 源码</h2>
              </div>
              <p>
                片段由仓库中的源码自动生成，保留真实文件名、行号和证据高亮；修改源码后可重新生成。
              </p>
            </div>
            <div className="source-browser">
              <div
                className="source-tabs"
                role="tablist"
                aria-label={`第 ${lesson.number} 课源码`}
              >
                {sources.map((source) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSource.key === source.key}
                    className={
                      activeSource.key === source.key ? "is-active" : ""
                    }
                    onClick={() => setSourceKey(source.key)}
                    key={source.key}
                  >
                    <span>{source.tab}</span>
                    <small>{source.filename}</small>
                  </button>
                ))}
              </div>
              <div className="source-view">
                <header>
                  <div className="window-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>{activeSource.path}</span>
                  <a href={activeSource.link} target="_blank" rel="noreferrer">
                    GitHub 完整源码 ↗
                  </a>
                </header>
                <div className="code-window">
                  {activeSource.code.split("\n").map((line, index) => {
                    const lineNumber = activeSource.startLine + index;
                    return (
                      <div
                        className={`code-line ${
                          activeSource.highlights.includes(lineNumber)
                            ? "is-highlighted"
                            : ""
                        }`}
                        key={`${activeSource.key}-${lineNumber}`}
                      >
                        <span>{lineNumber}</span>
                        <code>{line || " "}</code>
                      </div>
                    );
                  })}
                </div>
                <footer>
                  <span>WHY IT MATTERS</span>
                  <p>{activeSource.note}</p>
                </footer>
              </div>
            </div>
          </section>

          <section
            className="section-block practice-section"
            id="lesson-practice"
          >
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">RUN · PREDICT · PROVE</p>
                <h2>运行与动手练习</h2>
              </div>
              <p>
                先写预测，再运行示例；最后只用测试通过还不够，还要能说明测试建立了什么时序和不变量。
              </p>
            </div>

            <div className="practice-grid">
              <article className="terminal-card">
                <header>
                  <span>LESSON {lesson.number} / TERMINAL</span>
                  <button
                    type="button"
                    onClick={() => copyText("run", runCommand)}
                  >
                    {copied === "run" ? "已复制 ✓" : "复制命令"}
                  </button>
                </header>
                <pre>
                  <code>{runCommand}</code>
                </pre>
                <div className="terminal-output">
                  <span>$ observation target</span>
                  <p>{lesson.outcome}</p>
                  <p>先预测每个状态与数据变化，再对照程序输出。</p>
                </div>
              </article>

              <article className="exercise-card" id="lesson-exercise">
                <span className="exercise-badge">CORE EXERCISE</span>
                <h3>{lesson.exercise.title}</h3>
                <p>{lesson.exercise.summary}</p>
                <ul>
                  {lesson.exercise.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
                <div className="exercise-command">
                  <code>{lesson.exercise.testCommand}</code>
                  <button
                    type="button"
                    onClick={() =>
                      copyText("test", lesson.exercise.testCommand)
                    }
                  >
                    {copied === "test" ? "已复制 ✓" : "复制"}
                  </button>
                </div>
                <footer>
                  <span>PASS CONDITION</span>
                  <p>{lesson.exercise.expected}</p>
                </footer>
              </article>
            </div>

            <div className="proof-check">
              <span>观察现象</span>
              <b>+</b>
              <span>控制时序</span>
              <b>+</b>
              <span>规范推理</span>
              <i>三份证据共同支撑并发结论</i>
            </div>
          </section>

          <section
            className="section-block interview-section"
            id="lesson-interview"
          >
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">INTERVIEW REHEARSAL</p>
                <h2>先口述，再展开答案</h2>
              </div>
              <p>
                每题控制在 90 秒：结论 → 原理 → 正常流程 → 失败边界 → 工程取舍 → 验证证据。
              </p>
            </div>
            <div className="interview-list">
              {lesson.interview.map((item, index) => {
                const isOpen = revealedQuestion === index;
                return (
                  <article
                    className={isOpen ? "is-open" : ""}
                    key={item.question}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setRevealedQuestion(isOpen ? null : index)
                      }
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <small>{item.tag}</small>
                        <strong>{item.question}</strong>
                      </div>
                      <b>{isOpen ? "−" : "+"}</b>
                    </button>
                    {isOpen && (
                      <div className="interview-answer">
                        <span>REFERENCE</span>
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="lesson-finish">
            <div>
              <span>LESSON {lesson.number} / COMPLETION GATE</span>
              <h2>{lesson.finish}</h2>
            </div>
            <div className="finish-progress">
              <strong>{progress}%</strong>
              <span>
                {completed.size} / {tasks.length} checkpoints
              </span>
              <div>
                <i style={{ width: `${progress}%` }} />
              </div>
              <a href="#lesson-todo">回到 TODO ↑</a>
            </div>
          </section>
        </div>
      </div>

      <footer className="site-footer">
        <div>
          <strong>JUC CORE LAB</strong>
          <span>
            Lesson {lesson.number} · {lesson.shortTitle}
          </span>
        </div>
        <p>
          源码、测试与讲义来自
          <a
            href="https://github.com/caesaemc/JucCoreImp"
            target="_blank"
            rel="noreferrer"
          >
            caesaemc/JucCoreImp
          </a>
        </p>
        <a href="#lesson-top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
