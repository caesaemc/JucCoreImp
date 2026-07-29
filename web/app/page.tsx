"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";

const TODO_STORAGE_KEY = "juc-course.lesson-01.todos.v1";
const EXPECTED_COUNT = 400_000;

const learningTasks = [
  {
    id: "overview",
    label: "建立第一课知识地图",
    detail: "明确原子性、可见性、有序性与 JMM 的关系",
    href: "#knowledge-map",
  },
  {
    id: "lost-update",
    label: "推演确定性丢失更新",
    detail: "不运行代码，先解释为什么结果必然是 1",
    href: "#lost-update",
  },
  {
    id: "distribution",
    label: "观察并发计数数据分布",
    detail: "比较 UnsafeCounter 与 SynchronizedCounter",
    href: "#distribution",
  },
  {
    id: "jmm",
    label: "讲清 JMM 三个性质",
    detail: "能用自己的话解释原子性、可见性、有序性",
    href: "#three-properties",
  },
  {
    id: "hb",
    label: "画出 happens-before 图",
    detail: "掌握 start、join 与传递性的数据通路",
    href: "#happens-before",
  },
  {
    id: "source",
    label: "精读五份真实源码",
    detail: "把讲义结论对应到仓库中的具体行",
    href: "#source-lab",
  },
  {
    id: "exercise",
    label: "完成 ExerciseCounter",
    detail: "不使用 AtomicInteger，并启用练习测试",
    href: "#practice",
  },
  {
    id: "interview",
    label: "完成口述与面试复盘",
    detail: "用“结论—原理—边界—工程做法”回答",
    href: "#interview",
  },
] as const;

const learningPhases = [
  {
    number: "01",
    title: "看见问题",
    description: "确定性复现丢失更新，不靠概率猜测。",
    target: "#lost-update",
  },
  {
    number: "02",
    title: "拆开操作",
    description: "把 value++ 拆成读取、计算、写回。",
    target: "#three-properties",
  },
  {
    number: "03",
    title: "找到规则",
    description: "用 JMM 与 happens-before 判断保证。",
    target: "#happens-before",
  },
  {
    number: "04",
    title: "回到源码",
    description: "逐行定位共享数据、线程本地快照与同步边。",
    target: "#source-lab",
  },
  {
    number: "05",
    title: "形成证明",
    description: "完成练习、测试和面试口述闭环。",
    target: "#practice",
  },
];

const concepts = [
  {
    code: "A",
    title: "原子性",
    english: "Atomicity",
    question: "操作能否被别的线程从中间插入？",
    explanation:
      "value++ 是读取、计算、写回三个动作。单次 int 读写的原子性不能自动扩展到复合操作。",
    signal: "典型故障：丢失更新",
    tone: "amber",
  },
  {
    code: "V",
    title: "可见性",
    english: "Visibility",
    question: "一个线程的写，另一个线程保证看得到吗？",
    explanation:
      "没有同步关系时，普通字段的跨线程读取缺少规范保证。偶然看到新值也不能证明代码正确。",
    signal: "典型故障：停止标志不生效",
    tone: "cyan",
  },
  {
    code: "O",
    title: "有序性",
    english: "Ordering",
    question: "跨线程观察是否具有需要的先后关系？",
    explanation:
      "编译器、JIT 与处理器可以重排。JMM 约束的是合法可观察结果，不是机械执行源码顺序。",
    signal: "典型故障：观察到不完整状态",
    tone: "green",
  },
];

const lostUpdateSteps = [
  {
    short: "初始化",
    title: "共享值从 0 开始",
    description:
      "SharedState.value 位于共享对象中；两个线程还没有建立自己的 snapshot。",
    memory: 0,
    firstSnapshot: null,
    secondSnapshot: null,
    active: "memory",
  },
  {
    short: "T1 读取",
    title: "线程 1 复制旧值",
    description:
      "lost-update-1 执行 int snapshot = state.value，本地 snapshot 得到 0。",
    memory: 0,
    firstSnapshot: 0,
    secondSnapshot: null,
    active: "first",
  },
  {
    short: "T2 读取",
    title: "线程 2 也复制旧值",
    description:
      "写回闸门尚未开放，因此 lost-update-2 读取到同一个旧值 0。",
    memory: 0,
    firstSnapshot: 0,
    secondSnapshot: 0,
    active: "second",
  },
  {
    short: "开放闸门",
    title: "两个读取都已完成",
    description:
      "bothThreadsRead 降到 0，主线程才开放 allowWriteBack。此刻两个 snapshot 都是 0。",
    memory: 0,
    firstSnapshot: 0,
    secondSnapshot: 0,
    active: "gate",
  },
  {
    short: "T1 写回",
    title: "线程 1 写入 0 + 1",
    description:
      "共享 value 变为 1。线程 2 的本地 snapshot 不会跟着改变，仍然是 0。",
    memory: 1,
    firstSnapshot: 0,
    secondSnapshot: 0,
    active: "first",
  },
  {
    short: "T2 写回",
    title: "线程 2 覆盖为相同的 1",
    description:
      "线程 2 也写入 snapshot + 1，也就是 1。两次 +1 只保留了一次，结果确定为 1。",
    memory: 1,
    firstSnapshot: 0,
    secondSnapshot: 0,
    active: "second",
  },
] as const;

const counterRuns = {
  unsafe: {
    label: "UnsafeCounter",
    description: "普通 int 字段执行 value++，存在数据竞争",
    values: [107_176, 275_291, 229_204, 224_026, 243_654],
    tone: "danger",
  },
  synchronized: {
    label: "SynchronizedCounter",
    description: "increment 与 value 使用同一对象监视器",
    values: [400_000, 400_000, 400_000, 400_000, 400_000],
    tone: "safe",
  },
} as const;

const hbRules = [
  ["01", "程序次序", "同一线程中，前面的动作 happens-before 后面的动作。"],
  ["02", "监视器", "对一个监视器的解锁 happens-before 后续对它的加锁。"],
  ["03", "volatile", "volatile 写 happens-before 后续对同一字段的 volatile 读。"],
  ["04", "start", "start 调用前的动作 happens-before 新线程中的动作。"],
  ["05", "join", "目标线程的动作 happens-before 另一个线程从 join 返回。"],
  ["06", "传递性", "A → B 且 B → C，可以推出 A → C。"],
];

const sourceFiles = [
  {
    id: "deterministic",
    tab: "丢失更新",
    filename: "DeterministicLostUpdateDemo.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java",
    startLine: 14,
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java#L14-L45",
    note: "两个 CountDownLatch 把随机交错压缩为确定时序：先完成两次读取，再统一开放写回。",
    highlights: [16, 17, 20, 23, 24, 40, 43, 44, 45],
    code: `public static LostUpdateResult runOnce() throws InterruptedException {
    SharedState state = new SharedState();
    CountDownLatch bothThreadsRead = new CountDownLatch(2);
    CountDownLatch allowWriteBack = new CountDownLatch(1);

    Runnable increment = () -> {
        int snapshot = state.value;
        bothThreadsRead.countDown();
        try {
            allowWriteBack.await();
            state.value = snapshot + 1;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    };

    Thread first = new Thread(increment, "lost-update-1");
    Thread second = new Thread(increment, "lost-update-2");
    first.start();
    second.start();

    try {
        if (!bothThreadsRead.await(5, TimeUnit.SECONDS)) {
            throw new IllegalStateException("两个线程未能及时读取共享值");
        }
    } finally {
        allowWriteBack.countDown();
    }

    first.join();
    second.join();
    return new LostUpdateResult(2, state.value);
}`,
  },
  {
    id: "unsafe",
    tab: "非安全计数",
    filename: "UnsafeCounter.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/UnsafeCounter.java",
    startLine: 10,
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/UnsafeCounter.java#L10-L20",
    note: "问题不在 int 单次读写，而在 value++ 是一个复合的 read-modify-write。",
    highlights: [10, 14, 19],
    code: `private int value;

@Override
public void increment() {
    value++;
}

@Override
public int value() {
    return value;
}`,
  },
  {
    id: "synchronized",
    tab: "正确对照",
    filename: "SynchronizedCounter.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/SynchronizedCounter.java",
    startLine: 10,
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/SynchronizedCounter.java#L10-L20",
    note: "同一个对象监视器既提供互斥，也建立解锁到后续加锁的 happens-before。",
    highlights: [13, 14, 18, 19],
    code: `private int value;

@Override
public synchronized void increment() {
    value++;
}

@Override
public synchronized int value() {
    return value;
}`,
  },
  {
    id: "hb",
    tab: "start / join",
    filename: "HappensBeforeDemo.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java",
    startLine: 13,
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java#L13-L29",
    note: "字段都不是 volatile；可见性来自 start、join 与程序次序的传递组合。",
    highlights: [17, 21, 22, 25, 26, 29],
    code: `public static HappensBeforeResult demonstrate() throws InterruptedException {
    SharedState state = new SharedState();

    // 该写操作发生在 start() 之前。
    state.input = 42;

    Thread worker = new Thread(() -> {
        // start 规则保证工作线程能够看到 input == 42。
        state.observedByWorker = state.input;
        state.output = state.input * 2;
    }, "happens-before-worker");

    worker.start();
    worker.join();

    // join 规则保证主线程看到工作线程的写入。
    return new HappensBeforeResult(state.observedByWorker, state.output);
}`,
  },
  {
    id: "visibility",
    tab: "可见性",
    filename: "VisibilityDemo.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/VisibilityDemo.java",
    startLine: 84,
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/VisibilityDemo.java#L84-L115",
    note: "plain 版本缺少同步保证；volatile 版本的写与后续读建立 happens-before。",
    highlights: [86, 91, 97, 103, 108, 114],
    code: `private static final class PlainFlagTask implements Runnable {
    private final CountDownLatch started = new CountDownLatch(1);
    private boolean running = true;

    @Override
    public void run() {
        started.countDown();
        while (running) {
            // 编译器没有义务重复读取 running。
        }
    }

    private void stop() {
        running = false;
    }
}

private static final class VolatileFlagTask implements Runnable {
    private final CountDownLatch started = new CountDownLatch(1);
    private volatile boolean running = true;

    @Override
    public void run() {
        started.countDown();
        while (running) {
            // 每次判断都是 volatile 读。
        }
    }

    private void stop() {
        running = false;
    }
}`,
  },
] as const;

const interviewQuestions = [
  {
    question: "为什么 i++ 不是线程安全的？",
    answer:
      "因为它包含读取、计算、写回。两个线程可能读取同一个旧值，再写回相同新值。单次 int 读写原子不代表复合操作原子。",
    tag: "原子性",
  },
  {
    question: "没有 happens-before，是否一定读取旧值？",
    answer:
      "不一定。它表示规范没有提供所需保证，而不是每次都必然读到旧值。偶然读到新值也不能证明正确。",
    tag: "边界",
  },
  {
    question: "Thread.sleep 能修复可见性问题吗？",
    answer:
      "不能。sleep 只影响调度，不提供内存同步语义。正确做法必须建立 volatile、锁或其他规范定义的同步关系。",
    tag: "误区",
  },
  {
    question: "start 与 join 为什么不只是生命周期 API？",
    answer:
      "start 前动作对新线程可见；目标线程中的动作对成功从 join 返回的线程可见。它们都建立 happens-before 边。",
    tag: "JMM",
  },
  {
    question: "压力测试通过能证明线程安全吗？",
    answer:
      "不能。压力测试只能增加暴露问题的概率。正确性还需要基于所有合法执行的规范推理，复杂算法可辅以 jcstress。",
    tag: "测试",
  },
];

const command = `mvn -q -DskipTests package
java -cp target/classes com.caesaemc.juc.lesson01.Lesson01Application`;

function percent(value: number) {
  return `${Math.max(0, Math.min(100, (value / EXPECTED_COUNT) * 100))}%`;
}

export default function Home() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [lostStep, setLostStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [counterMode, setCounterMode] =
    useState<keyof typeof counterRuns>("unsafe");
  const [sourceId, setSourceId] = useState(sourceFiles[0].id);
  const [revealedQuestion, setRevealedQuestion] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(TODO_STORAGE_KEY);
        if (saved) {
          const values = JSON.parse(saved);
          if (Array.isArray(values)) {
            setCompleted(
              new Set(
                values.filter((value): value is string =>
                  learningTasks.some((task) => task.id === value),
                ),
              ),
            );
          }
        }
      } catch {
        // 本地进度损坏时从空清单开始，不影响课程内容。
      } finally {
        setHydrated(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(
      TODO_STORAGE_KEY,
      JSON.stringify(Array.from(completed)),
    );
  }, [completed, hydrated]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    if (lostStep >= lostUpdateSteps.length - 1) {
      return;
    }
    const timer = window.setTimeout(() => {
      setLostStep((current) =>
        Math.min(current + 1, lostUpdateSteps.length - 1),
      );
      if (lostStep === lostUpdateSteps.length - 2) {
        setPlaying(false);
      }
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [lostStep, playing]);

  const progress = Math.round((completed.size / learningTasks.length) * 100);
  const currentLostStep = lostUpdateSteps[lostStep];
  const activeSource =
    sourceFiles.find((source) => source.id === sourceId) ?? sourceFiles[0];
  const activeCounter = counterRuns[counterMode];

  const counterSummary = useMemo(() => {
    const average =
      activeCounter.values.reduce((sum, value) => sum + value, 0) /
      activeCounter.values.length;
    return {
      average: Math.round(average),
      averageLost: Math.round(EXPECTED_COUNT - average),
      retained: Math.round((average / EXPECTED_COUNT) * 100),
    };
  }, [activeCounter]);

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

  function resetTasks() {
    setCompleted(new Set());
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="回到页面顶部">
          <span className="brand-mark">JC</span>
          <span>
            <strong>JUC CORE LAB</strong>
            <small>并发不是玄学，是可证明的时序</small>
          </span>
        </a>
        <nav className="top-nav" aria-label="第一课导航">
          <a href="#knowledge-map">知识地图</a>
          <a href="#lost-update">线程实验</a>
          <a href="#source-lab">源码</a>
          <a href="#interview">面试</a>
        </nav>
        <div className="header-progress" aria-label={`第一课进度 ${progress}%`}>
          <span>LESSON 01 / 16</span>
          <div className="mini-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <b>{progress}%</b>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span>JAVA 21</span>
            <span>LESSON 01</span>
            <span>JMM FOUNDATION</span>
          </p>
          <h1>
            看懂每一次
            <br />
            <em>读、算、写</em>
          </h1>
          <p className="hero-lead">
            从一个确定结果为 <strong>1</strong> 的错误计数器出发，建立分析所有
            Java 并发问题的第一套坐标系：原子性、可见性、有序性，以及
            happens-before。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#lost-update">
              开始线程推演 <span aria-hidden="true">→</span>
            </a>
            <a className="button secondary" href="#learning-todo">
              查看学习 TODO
            </a>
          </div>
          <div className="hero-facts" aria-label="第一课内容统计">
            <div>
              <strong>03</strong>
              <span>核心性质</span>
            </div>
            <div>
              <strong>06</strong>
              <span>HB 规则</span>
            </div>
            <div>
              <strong>05</strong>
              <span>源码入口</span>
            </div>
            <div>
              <strong>08</strong>
              <span>完成项</span>
            </div>
          </div>
        </div>

        <div className="hero-system" aria-label="两个线程访问共享内存示意图">
          <div className="system-caption">
            <span>LIVE MODEL</span>
            <b>共享状态如何丢掉一次更新</b>
          </div>
          <div className="hero-thread hero-thread-one">
            <span className="thread-led" />
            <div>
              <small>THREAD / 01</small>
              <strong>snapshot = 0</strong>
            </div>
          </div>
          <div className="hero-thread hero-thread-two">
            <span className="thread-led" />
            <div>
              <small>THREAD / 02</small>
              <strong>snapshot = 0</strong>
            </div>
          </div>
          <div className="flow-wire wire-one">
            <span>READ</span>
          </div>
          <div className="flow-wire wire-two">
            <span>WRITE</span>
          </div>
          <div className="memory-core">
            <small>SHARED HEAP</small>
            <span>state.value</span>
            <strong>1</strong>
            <i>EXPECTED 2</i>
          </div>
          <div className="system-alert">
            <span>!</span>
            两个相同旧值覆盖同一内存单元
          </div>
        </div>
      </section>

      <section className="course-map section-block" id="knowledge-map">
        <div className="section-heading">
          <div>
            <p className="section-kicker">LEARNING ROUTE</p>
            <h2>第一课总体流程</h2>
          </div>
          <p>
            每一步都回答一个问题，并把答案落回真实源码。顺序可以回看，但不要跳过“先预测再运行”。
          </p>
        </div>
        <div className="phase-track">
          {learningPhases.map((phase, index) => (
            <a href={phase.target} className="phase-card" key={phase.number}>
              <span className="phase-number">{phase.number}</span>
              <div>
                <small>STEP {index + 1}</small>
                <h3>{phase.title}</h3>
                <p>{phase.description}</p>
              </div>
              <b aria-hidden="true">↘</b>
            </a>
          ))}
        </div>
      </section>

      <div className="learning-layout">
        <aside className="learning-sidebar" id="learning-todo">
          <div className="todo-heading">
            <div>
              <p className="section-kicker">YOUR CHECKPOINTS</p>
              <h2>本课 TODO</h2>
            </div>
            <span>{completed.size}/8</span>
          </div>
          <div className="todo-progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="todo-list" data-testid="learning-checklist">
            {learningTasks.map((task, index) => {
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
            <button type="button" onClick={resetTasks}>
              重置
            </button>
          </div>
        </aside>

        <div className="lesson-content">
          <section className="section-block concepts-section" id="three-properties">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">THE COORDINATE SYSTEM</p>
                <h2>并发分析的三个坐标</h2>
              </div>
              <p>
                遇到共享状态时，先逐项问这三个问题，再决定要不要使用锁、volatile
                或原子类。
              </p>
            </div>
            <div className="concept-grid">
              {concepts.map((concept) => (
                <article
                  className={`concept-card tone-${concept.tone}`}
                  key={concept.code}
                >
                  <div className="concept-top">
                    <span>{concept.code}</span>
                    <small>{concept.english}</small>
                  </div>
                  <h3>{concept.title}</h3>
                  <strong>{concept.question}</strong>
                  <p>{concept.explanation}</p>
                  <footer>{concept.signal}</footer>
                </article>
              ))}
            </div>
            <div className="jmm-definition">
              <span>JMM ≠ 物理内存布局</span>
              <p>
                Java 内存模型是一组<strong>语言级语义规则</strong>
                ：一个读允许看到哪个写、哪些动作建立跨线程顺序、哪些执行结果是合法的。
              </p>
            </div>
          </section>

          <section className="section-block lab-section" id="lost-update">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">DETERMINISTIC LAB</p>
                <h2>确定性丢失更新推演</h2>
              </div>
              <p>
                这不是一段随机动画。它严格对应
                <code> DeterministicLostUpdateDemo.runOnce()</code> 的闸门时序。
              </p>
            </div>

            <div className="lab-console">
              <div className="lab-toolbar">
                <div className="step-pills" aria-label="实验步骤">
                  {lostUpdateSteps.map((step, index) => (
                    <button
                      type="button"
                      className={index === lostStep ? "is-active" : ""}
                      aria-pressed={index === lostStep}
                      onClick={() => {
                        setPlaying(false);
                        setLostStep(index);
                      }}
                      key={step.short}
                    >
                      <span>{index}</span>
                      {step.short}
                    </button>
                  ))}
                </div>
                <div className="play-controls">
                  <button
                    type="button"
                    onClick={() => {
                      if (lostStep >= lostUpdateSteps.length - 1) {
                        setLostStep(0);
                      }
                      setPlaying((current) => !current);
                    }}
                  >
                    {playing ? "暂停" : "自动播放"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setLostStep((current) =>
                        Math.min(current + 1, lostUpdateSteps.length - 1),
                      );
                    }}
                    disabled={lostStep === lostUpdateSteps.length - 1}
                  >
                    下一步 →
                  </button>
                </div>
              </div>

              <div className="memory-map">
                <article
                  className={`thread-lane ${
                    currentLostStep.active === "first" ? "is-active" : ""
                  }`}
                >
                  <header>
                    <span className="status-dot" />
                    <div>
                      <small>THREAD STACK</small>
                      <strong>lost-update-1</strong>
                    </div>
                  </header>
                  <div className="local-variable">
                    <span>local snapshot</span>
                    <b>
                      {currentLostStep.firstSnapshot === null
                        ? "—"
                        : currentLostStep.firstSnapshot}
                    </b>
                  </div>
                  <code>state.value = snapshot + 1</code>
                </article>

                <div className="memory-path">
                  <span className="path-read">READ →</span>
                  <span className="path-write">← WRITE</span>
                </div>

                <article
                  className={`shared-memory ${
                    currentLostStep.active === "memory" ? "is-active" : ""
                  }`}
                >
                  <header>
                    <small>SHARED HEAP OBJECT</small>
                    <strong>SharedState</strong>
                  </header>
                  <div className="memory-value">
                    <span>value</span>
                    <b>{currentLostStep.memory}</b>
                  </div>
                  <footer>
                    <span>期望 2</span>
                    <span>实际 {currentLostStep.memory}</span>
                  </footer>
                </article>

                <div className="memory-path reverse">
                  <span className="path-read">← READ</span>
                  <span className="path-write">WRITE →</span>
                </div>

                <article
                  className={`thread-lane ${
                    currentLostStep.active === "second" ? "is-active" : ""
                  }`}
                >
                  <header>
                    <span className="status-dot" />
                    <div>
                      <small>THREAD STACK</small>
                      <strong>lost-update-2</strong>
                    </div>
                  </header>
                  <div className="local-variable">
                    <span>local snapshot</span>
                    <b>
                      {currentLostStep.secondSnapshot === null
                        ? "—"
                        : currentLostStep.secondSnapshot}
                    </b>
                  </div>
                  <code>state.value = snapshot + 1</code>
                </article>
              </div>

              <div className="step-explanation">
                <span>{String(lostStep).padStart(2, "0")}</span>
                <div>
                  <small>{currentLostStep.short}</small>
                  <h3>{currentLostStep.title}</h3>
                  <p>{currentLostStep.description}</p>
                </div>
                <div
                  className={`gate-indicator ${
                    lostStep >= 3 ? "is-open" : ""
                  }`}
                >
                  <i />
                  <span>WRITE GATE</span>
                  <b>{lostStep >= 3 ? "OPEN" : "CLOSED"}</b>
                </div>
              </div>
            </div>

            <div className="data-placement">
              <div>
                <span className="placement-icon">H</span>
                <small>共享堆对象</small>
                <strong>state.value</strong>
                <p>两个线程冲突访问的同一内存位置。</p>
              </div>
              <div>
                <span className="placement-icon">T1</span>
                <small>线程本地</small>
                <strong>snapshot = 0</strong>
                <p>读取之后独立存在，不会随共享值变化。</p>
              </div>
              <div>
                <span className="placement-icon">T2</span>
                <small>线程本地</small>
                <strong>snapshot = 0</strong>
                <p>与 T1 保存相同旧值，形成覆盖条件。</p>
              </div>
              <div>
                <span className="placement-icon">G</span>
                <small>同步控制</small>
                <strong>2 个 Latch</strong>
                <p>只控制实验时序，不是业务修复方案。</p>
              </div>
            </div>
          </section>

          <section className="section-block distribution-section" id="distribution">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">REFERENCE RUN / JDK 21</p>
                <h2>并发结果与数据分布</h2>
              </div>
              <p>
                4 个线程 × 每线程 100,000 次。数据来自仓库代码的一次真实运行；错误值每次可能不同。
              </p>
            </div>

            <div className="distribution-panel">
              <div className="distribution-summary">
                <div className="mode-switch" role="group" aria-label="选择计数器">
                  {(Object.keys(counterRuns) as Array<keyof typeof counterRuns>).map(
                    (mode) => (
                      <button
                        type="button"
                        className={counterMode === mode ? "is-active" : ""}
                        aria-pressed={counterMode === mode}
                        onClick={() => setCounterMode(mode)}
                        key={mode}
                      >
                        {counterRuns[mode].label}
                      </button>
                    ),
                  )}
                </div>
                <p>{activeCounter.description}</p>
                <div className="summary-numbers">
                  <div>
                    <small>平均保留</small>
                    <strong>{counterSummary.average.toLocaleString()}</strong>
                    <span>{counterSummary.retained}% of expected</span>
                  </div>
                  <div>
                    <small>平均丢失</small>
                    <strong>{counterSummary.averageLost.toLocaleString()}</strong>
                    <span>updates overwritten</span>
                  </div>
                </div>
                <div className="distribution-warning">
                  <span>关键结论</span>
                  <p>
                    {counterMode === "unsafe"
                      ? "错误程序也可能偶然得到正确结果，因此“实际值一定小于期望值”不是稳定断言。"
                      : "五轮全为 400,000 是实现语义与测试证据的共同结果，但证明仍来自监视器规则。"}
                  </p>
                </div>
              </div>

              <div className={`run-chart chart-${activeCounter.tone}`}>
                <div className="chart-legend">
                  <span>
                    <i className="legend-actual" /> 实际保留
                  </span>
                  <span>
                    <i className="legend-lost" /> 丢失更新
                  </span>
                  <b>期望 / 400,000</b>
                </div>
                {activeCounter.values.map((value, index) => {
                  const lost = EXPECTED_COUNT - value;
                  const style = {
                    "--actual-width": percent(value),
                  } as CSSProperties;
                  return (
                    <div className="run-row" key={`${counterMode}-${index}`}>
                      <span>RUN {String(index + 1).padStart(2, "0")}</span>
                      <div className="bar-track" style={style}>
                        <i className="bar-actual" />
                        <i className="bar-lost" />
                      </div>
                      <div className="run-values">
                        <strong>{value.toLocaleString()}</strong>
                        <small>− {lost.toLocaleString()}</small>
                      </div>
                    </div>
                  );
                })}
                <div className="chart-axis">
                  <span>0</span>
                  <span>100k</span>
                  <span>200k</span>
                  <span>300k</span>
                  <span>400k</span>
                </div>
              </div>
            </div>
          </section>

          <section className="section-block hb-section" id="happens-before">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">MEMORY ORDER</p>
                <h2>happens-before 数据流</h2>
              </div>
              <p>
                它不是墙上时钟顺序，而是“结果必须可见、动作具有内存语义先后”的规范关系。
              </p>
            </div>

            <div className="hb-flow">
              <div className="hb-lane-title">
                <span>主线程 / MAIN</span>
                <span>工作线程 / WORKER</span>
              </div>
              <div className="hb-nodes">
                <div className="hb-node main-node">
                  <small>PROGRAM ORDER</small>
                  <strong>state.input = 42</strong>
                  <span>普通字段写</span>
                </div>
                <div className="hb-edge start-edge">
                  <span>① start rule</span>
                  <b>→</b>
                </div>
                <div className="hb-node worker-node">
                  <small>VISIBLE AFTER START</small>
                  <strong>read input = 42</strong>
                  <span>工作线程可靠观察</span>
                </div>
                <div className="hb-node worker-node output-node">
                  <small>PROGRAM ORDER</small>
                  <strong>output = 84</strong>
                  <span>普通字段写</span>
                </div>
                <div className="hb-edge join-edge">
                  <span>② join rule</span>
                  <b>←</b>
                </div>
                <div className="hb-node main-node return-node">
                  <small>VISIBLE AFTER JOIN</small>
                  <strong>read output = 84</strong>
                  <span>主线程可靠观察</span>
                </div>
              </div>
              <div className="transitivity">
                <span>③ TRANSITIVITY</span>
                <p>
                  写 input → start → 读 input → 写 output → join → 读 output
                </p>
                <b>整条链形成从 42 到 84 的安全数据通路</b>
              </div>
            </div>

            <div className="hb-rules">
              {hbRules.map(([number, title, description]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section-block source-section" id="source-lab">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">SOURCE WALKTHROUGH</p>
                <h2>讲义结论落回真实源码</h2>
              </div>
              <p>
                所有片段来自当前仓库，保留真实文件名与起始行号。高亮行是本课推理的证据点。
              </p>
            </div>

            <div className="source-browser">
              <div className="source-tabs" role="tablist" aria-label="第一课源码">
                {sourceFiles.map((source) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSource.id === source.id}
                    className={activeSource.id === source.id ? "is-active" : ""}
                    onClick={() => setSourceId(source.id)}
                    key={source.id}
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
                          activeSource.highlights.includes(
                            lineNumber as never,
                          )
                            ? "is-highlighted"
                            : ""
                        }`}
                        key={`${activeSource.id}-${lineNumber}`}
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

          <section className="section-block practice-section" id="practice">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">RUN · PREDICT · PROVE</p>
                <h2>动手练习</h2>
              </div>
              <p>
                先写下预测，再运行代码。观察能发现问题，规范推理才能证明修复。
              </p>
            </div>

            <div className="practice-grid">
              <article className="terminal-card">
                <header>
                  <span>TERMINAL</span>
                  <button type="button" onClick={copyCommand}>
                    {copied ? "已复制 ✓" : "复制命令"}
                  </button>
                </header>
                <pre>
                  <code>{command}</code>
                </pre>
                <div className="terminal-output">
                  <span>$ expected observation</span>
                  <p>确定性实验：期望=2，实际=1</p>
                  <p>安全计数器：期望=400000，实际=400000</p>
                  <p>start/join：工作线程读取=42，主线程读取=84</p>
                </div>
              </article>

              <article className="exercise-card">
                <span className="exercise-badge">CORE EXERCISE</span>
                <h3>修复 ExerciseCounter</h3>
                <p>
                  不允许使用 AtomicInteger。increment 不能丢失更新，value
                  必须正确观察已完成更新。
                </p>
                <ul>
                  <li>指出共享状态和业务不变量</li>
                  <li>说明建立了哪条 happens-before</li>
                  <li>删除测试上的 @Disabled</li>
                  <li>运行 8 线程 × 50,000 次测试</li>
                </ul>
                <a
                  href="https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/ExerciseCounter.java"
                  target="_blank"
                  rel="noreferrer"
                >
                  打开练习源码 <span>→</span>
                </a>
              </article>
            </div>

            <div className="proof-check">
              <span>一次正确运行</span>
              <b>≠</b>
              <span>所有合法执行都正确</span>
              <i>测试证据 + JMM 推理，二者缺一不可</i>
            </div>
          </section>

          <section className="section-block interview-section" id="interview">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">INTERVIEW REHEARSAL</p>
                <h2>先口述，再展开答案</h2>
              </div>
              <p>
                每题控制在 90 秒：结论 → 原理 → 规范保证 → 反例或边界 → 工程做法。
              </p>
            </div>

            <div className="interview-list">
              {interviewQuestions.map((item, index) => {
                const isOpen = revealedQuestion === index;
                return (
                  <article className={isOpen ? "is-open" : ""} key={item.question}>
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
              <span>LESSON 01 / COMPLETION GATE</span>
              <h2>
                当你能不用代码，
                <br />
                画出 <em>42 → 84</em> 的可见性链路，
                <br />
                第一课才算真正完成。
              </h2>
            </div>
            <div className="finish-progress">
              <strong>{progress}%</strong>
              <span>{completed.size} / {learningTasks.length} checkpoints</span>
              <div>
                <i style={{ width: `${progress}%` }} />
              </div>
              <a href="#learning-todo">回到 TODO ↑</a>
            </div>
          </section>
        </div>
      </div>

      <footer className="site-footer">
        <div>
          <strong>JUC CORE LAB</strong>
          <span>Lesson 01 · Java Memory Model</span>
        </div>
        <p>
          源码、测试、讲义来自
          <a
            href="https://github.com/caesaemc/JucCoreImp"
            target="_blank"
            rel="noreferrer"
          >
            caesaemc/JucCoreImp
          </a>
        </p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
