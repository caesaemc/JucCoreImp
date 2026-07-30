"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useState,
} from "react";

type RouteDirection = "left" | "right";
type MetricTone = "default" | "success" | "warning" | "danger";

type RuntimeMetric = {
  label: string;
  value: string | number;
  tone?: MetricTone;
};

type RuntimeStep = {
  short: string;
  actor: string;
  action: string;
  explanation: string;
  operation: string;
  change: string;
  route: string;
  token?: string;
};

type RuntimeLabFrameProps<Step extends RuntimeStep> = {
  lessonNumber: string;
  title: string;
  mapCaption: string;
  steps: readonly Step[];
  metrics: (step: Step) => RuntimeMetric[];
  footnote: string;
  renderMap: (step: Step, stepIndex: number) => ReactNode;
};

type SystemZoneProps = {
  title: string;
  subtitle: string;
  active?: boolean;
  tone?: "thread" | "heap" | "sync" | "result" | "danger";
  className?: string;
  children: ReactNode;
};

type SystemLinkProps = {
  active: boolean;
  direction?: RouteDirection;
  label: string;
  token?: string;
  stepIndex: number;
  tone?: "default" | "success" | "warning" | "danger";
};

function RuntimeLabFrame<Step extends RuntimeStep>({
  lessonNumber,
  title,
  mapCaption,
  steps,
  metrics,
  footnote,
  renderMap,
}: RuntimeLabFrameProps<Step>) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!playing || stepIndex >= steps.length - 1) {
      return;
    }
    const nextStep = stepIndex + 1;
    const timer = window.setTimeout(() => {
      setStepIndex(nextStep);
      if (nextStep === steps.length - 1) {
        setPlaying(false);
      }
    }, 1550);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, steps.length]);

  function selectStep(index: number) {
    setPlaying(false);
    setStepIndex(index);
  }

  function togglePlay() {
    if (stepIndex === steps.length - 1) {
      setStepIndex(0);
    }
    setPlaying((current) => !current);
  }

  return (
    <div className={`runtime-lab course-runtime-lab lesson-runtime-${lessonNumber}`}>
      <div className="runtime-toolbar">
        <div>
          <span>
            {title} · STEP {stepIndex + 1}/{steps.length}
          </span>
          <strong>{step.short}</strong>
        </div>
        <div className="runtime-metrics" aria-label="当前运行状态">
          {metrics(step).map((metric) => (
            <span
              className={
                metric.tone && metric.tone !== "default"
                  ? `metric-${metric.tone}`
                  : undefined
              }
              key={metric.label}
            >
              {metric.label}
              <b>{metric.value}</b>
            </span>
          ))}
        </div>
        <div className="runtime-controls" aria-label="动画控制">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => selectStep(Math.max(0, stepIndex - 1))}
          >
            上一步
          </button>
          <button
            type="button"
            className="is-primary"
            aria-pressed={playing}
            onClick={togglePlay}
          >
            {playing
              ? "暂停"
              : stepIndex === steps.length - 1
                ? "重播"
                : "播放"}
          </button>
          <button
            type="button"
            disabled={stepIndex === steps.length - 1}
            onClick={() =>
              selectStep(Math.min(steps.length - 1, stepIndex + 1))
            }
          >
            下一步
          </button>
        </div>
      </div>

      <div className="runtime-map-scroll">
        <div
          className="runtime-map system-runtime-map"
          role="img"
          aria-label={`${title}。当前步骤：${step.action}`}
        >
          <header className="runtime-map-header">
            <strong>Java 进程运行结构（教学简化）</strong>
            <span>{mapCaption}</span>
          </header>
          {renderMap(step, stepIndex)}
          <footer className="runtime-map-footnote">{footnote}</footer>
        </div>
      </div>

      <div
        className="runtime-timeline system-runtime-timeline"
        style={{ "--timeline-count": steps.length } as CSSProperties}
        aria-label={`${steps.length} 步执行顺序`}
      >
        {steps.map((item, index) => (
          <button
            type="button"
            className={`${index === stepIndex ? "is-current" : ""} ${
              index < stepIndex ? "is-past" : ""
            }`}
            aria-current={index === stepIndex ? "step" : undefined}
            onClick={() => selectStep(index)}
            key={item.short}
          >
            <span>{index + 1}</span>
            <small>{item.short}</small>
          </button>
        ))}
      </div>

      <div className="runtime-readout" aria-live="polite">
        <span>{step.actor}</span>
        <div>
          <strong>{step.action}</strong>
          <p>{step.explanation}</p>
        </div>
        <code>{step.operation}</code>
        <em>{step.change}</em>
      </div>
    </div>
  );
}

function MetadataStrip({
  classNames,
  instruction,
}: {
  classNames: string;
  instruction: string;
}) {
  return (
    <section className="system-metadata">
      <strong>类元数据 / Metaspace</strong>
      <code>{classNames}</code>
      <span>{instruction}</span>
    </section>
  );
}

function SystemZone({
  title,
  subtitle,
  active = false,
  tone = "heap",
  className = "",
  children,
}: SystemZoneProps) {
  return (
    <section
      className={`runtime-zone system-zone tone-${tone} ${
        active ? "is-active" : ""
      } ${className}`}
    >
      <header>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </header>
      <div className="system-zone-body">{children}</div>
    </section>
  );
}

function StateRow({
  label,
  value,
  active = false,
  tone = "default",
}: {
  label: string;
  value: string | number;
  active?: boolean;
  tone?: MetricTone;
}) {
  return (
    <div
      className={`system-state-row ${active ? "is-changing" : ""} ${
        tone !== "default" ? `tone-${tone}` : ""
      }`}
    >
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function SystemLink({
  active,
  direction = "right",
  label,
  token,
  stepIndex,
  tone = "default",
}: SystemLinkProps) {
  return (
    <div
      className={`system-link direction-${direction} ${
        active ? "is-active" : ""
      } tone-${tone}`}
      aria-hidden="true"
    >
      <span>{label}</span>
      <div>
        {active && token ? (
          <i className="system-data-packet" key={`${label}-${stepIndex}`}>
            {token}
          </i>
        ) : null}
      </div>
    </div>
  );
}

function ObjectBox({
  title,
  type,
  active = false,
  children,
}: {
  title: string;
  type: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`system-object ${active ? "is-changing" : ""}`}>
      <header>
        <strong>{title}</strong>
        <span>{type}</span>
      </header>
      <div>{children}</div>
    </div>
  );
}

type PublicationStep = RuntimeStep & {
  current: "@S0" | "@S1";
  writerRef: "—" | "@S1";
  readerRef: "—" | "@S0" | "@S1";
  readerFields: string;
  hasV1: boolean;
  consistent: "待读取" | "是";
  activeZone: "heap" | "writer" | "reader";
};

const PUBLICATION_STEPS: readonly PublicationStep[] = [
  {
    short: "旧快照",
    actor: "共享堆",
    action: "ConfigRepository.current 指向不可变的 Settings v0",
    explanation:
      "读写线程共享的是仓库对象和 Settings 对象；各自的局部引用只在线程栈中。",
    operation: "volatile Settings current = @S0",
    change: "堆：current → @S0；writer/reader 栈暂时都没有新引用",
    route: "none",
    current: "@S0",
    writerRef: "—",
    readerRef: "—",
    readerFields: "—",
    hasV1: false,
    consistent: "待读取",
    activeZone: "heap",
  },
  {
    short: "构造 v1",
    actor: "config-writer",
    action: "先完整构造 Settings v1，再把 @S1 保存到 writer 栈",
    explanation:
      "version、timeout、retries 和 checksum 一起进入同一个 final 字段对象；共享入口仍指向 v0。",
    operation: "candidate = Settings.of(1, 10, 1)",
    change: "堆新增 Settings @S1；writer.candidate → @S1；current 仍是 @S0",
    route: "writer-heap",
    token: "new",
    current: "@S0",
    writerRef: "@S1",
    readerRef: "—",
    readerFields: "—",
    hasV1: true,
    consistent: "待读取",
    activeZone: "writer",
  },
  {
    short: "volatile 发布",
    actor: "config-writer",
    action: "一次 volatile 写把共享入口从 @S0 替换为 @S1",
    explanation:
      "写入的是对象引用，不是逐个改 Settings 字段；写前构造动作随发布边对后续读取者可见。",
    operation: "repository.current = candidate",
    change: "堆：volatile current @S0 → @S1",
    route: "writer-heap",
    token: "@S1",
    current: "@S1",
    writerRef: "@S1",
    readerRef: "—",
    readerFields: "—",
    hasV1: true,
    consistent: "待读取",
    activeZone: "heap",
  },
  {
    short: "volatile 读取",
    actor: "config-reader",
    action: "reader 只读取一次 current，把 @S1 放入自己的栈",
    explanation:
      "同一个 volatile 字段的写 happens-before 这次读，因此 reader 能看到完整构造后的 v1。",
    operation: "Settings snapshot = repository.snapshot()",
    change: "reader.snapshot — → @S1；current 仍指向 @S1",
    route: "heap-reader",
    token: "@S1",
    current: "@S1",
    writerRef: "@S1",
    readerRef: "@S1",
    readerFields: "—",
    hasV1: true,
    consistent: "待读取",
    activeZone: "reader",
  },
  {
    short: "读取字段",
    actor: "config-reader",
    action: "通过同一个 snapshot 读取 v1 的全部 final 字段",
    explanation:
      "读取过程中不会再次取 current，因此不会把两个版本的字段拼在一起。",
    operation: "snapshot.version(), timeoutMillis(), retries()",
    change: "reader 观察到 version=1 / timeout=10 / retries=1",
    route: "heap-reader",
    token: "v1",
    current: "@S1",
    writerRef: "@S1",
    readerRef: "@S1",
    readerFields: "v=1 · t=10 · r=1",
    hasV1: true,
    consistent: "待读取",
    activeZone: "reader",
  },
  {
    short: "校验一致",
    actor: "config-reader",
    action: "checksum 与同一快照字段匹配，读取结果一致",
    explanation:
      "旧对象 @S0 从未被原地修改；没有线程能看到“半个 v0 + 半个 v1”。",
    operation: "snapshot.isConsistent() == true",
    change: "一致性：待读取 → 是；共享 current 保持 @S1",
    route: "none",
    current: "@S1",
    writerRef: "@S1",
    readerRef: "@S1",
    readerFields: "v=1 · t=10 · r=1",
    hasV1: true,
    consistent: "是",
    activeZone: "reader",
  },
];

function PublicationMap({
  step,
  stepIndex,
}: {
  step: PublicationStep;
  stepIndex: number;
}) {
  return (
    <>
      <MetadataStrip
        classNames="SafePublicationDemo · ConfigRepository · Settings"
        instruction="字段结构和方法字节码在这里；current 与 Settings 实例在堆里。"
      />
      <div className="system-flow-grid system-grid-five">
        <SystemZone
          title="config-writer 线程栈"
          subtitle="只归 writer"
          tone="thread"
          active={step.activeZone === "writer"}
        >
          <ObjectBox title="update() 栈帧" type="stack frame">
            <StateRow label="repository" value="@R1" />
            <StateRow
              label="candidate"
              value={step.writerRef}
              active={step.activeZone === "writer"}
            />
          </ObjectBox>
        </SystemZone>

        <SystemLink
          active={step.route === "writer-heap"}
          label={step.short === "构造 v1" ? "构造对象" : "volatile 写"}
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="堆 / Heap"
          subtitle="writer 与 reader 共享"
          tone="heap"
          active={step.activeZone === "heap"}
          className="system-wide-zone"
        >
          <ObjectBox
            title="ConfigRepository @R1"
            type="shared object"
            active={step.short === "volatile 发布"}
          >
            <StateRow
              label="volatile current"
              value={`→ ${step.current}`}
              active={step.short === "volatile 发布"}
            />
          </ObjectBox>
          <div className="publication-settings">
            <ObjectBox title="Settings @S0" type="immutable · old">
              <StateRow label="fields" value="v=0 · t=100 · r=1" />
            </ObjectBox>
            <ObjectBox
              title={step.hasV1 ? "Settings @S1" : "Settings @S1（尚未创建）"}
              type="immutable · new"
              active={step.short === "构造 v1"}
            >
              <StateRow
                label="final fields"
                value={step.hasV1 ? "v=1 · t=10 · r=1" : "—"}
              />
              <StateRow
                label="checksum"
                value={step.hasV1 ? "computed" : "—"}
              />
            </ObjectBox>
          </div>
          <div className="system-edge-note">
            volatile 写 current → 后续 volatile 读 current
            <strong>happens-before</strong>
          </div>
        </SystemZone>

        <SystemLink
          active={step.route === "heap-reader"}
          label={step.short === "读取字段" ? "解引用字段" : "volatile 读"}
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="config-reader 线程栈"
          subtitle="只归 reader"
          tone="thread"
          active={step.activeZone === "reader"}
        >
          <ObjectBox title="snapshot() 栈帧" type="stack frame">
            <StateRow
              label="snapshot"
              value={step.readerRef}
              active={step.short === "volatile 读取"}
            />
            <StateRow
              label="读取字段"
              value={step.readerFields}
              active={step.short === "读取字段"}
            />
            <StateRow
              label="consistent"
              value={step.consistent}
              active={step.short === "校验一致"}
              tone={step.consistent === "是" ? "success" : "default"}
            />
          </ObjectBox>
        </SystemZone>
      </div>
    </>
  );
}

type AqsQueueState = "uninitialized" | "waiting-b" | "head-b";

type AqsStep = RuntimeStep & {
  syncState: 0 | 1;
  owner: "—" | "Thread A" | "Thread B";
  aStatus: "RUNNABLE" | "OWNER" | "RELEASED";
  bStatus: "RUNNABLE" | "CONTENDING" | "WAITING" | "OWNER";
  bObserved: "—" | "state=1" | "state=0";
  queue: AqsQueueState;
  activeZone: "heap" | "a" | "b";
};

const AQS_STEPS: readonly AqsStep[] = [
  {
    short: "锁空闲",
    actor: "共享堆",
    action: "Mutex.Sync 刚创建，AQS state=0，等待队列尚未初始化",
    explanation:
      "Mutex 对象和内部 Sync/AQS 对象在堆中；线程栈只保存调用和本次 CAS 的观察值。",
    operation: "new Mutex()",
    change: "state=0 · owner=— · head=null · tail=null",
    route: "none",
    syncState: 0,
    owner: "—",
    aStatus: "RUNNABLE",
    bStatus: "RUNNABLE",
    bObserved: "—",
    queue: "uninitialized",
    activeZone: "heap",
  },
  {
    short: "A 获取",
    actor: "Thread A",
    action: "A 执行 CAS(0,1) 成功并登记独占持有者",
    explanation:
      "快速路径成功时不需要创建等待节点；state 从 0 更新为 1。",
    operation: "compareAndSetState(0, 1) == true",
    change: "state 0 → 1；owner — → Thread A",
    route: "a-heap",
    token: "CAS",
    syncState: 1,
    owner: "Thread A",
    aStatus: "OWNER",
    bStatus: "RUNNABLE",
    bObserved: "—",
    queue: "uninitialized",
    activeZone: "a",
  },
  {
    short: "B 竞争失败",
    actor: "Thread B",
    action: "B 也尝试 CAS(0,1)，但实际 state 已经是 1",
    explanation:
      "失败表示锁状态已经改变，B 不能进入受保护区，也不能直接覆盖 state。",
    operation: "compareAndSetState(0, 1) == false",
    change: "B observed=state=1；共享 state 仍是 1",
    route: "b-heap",
    token: "CAS×",
    syncState: 1,
    owner: "Thread A",
    aStatus: "OWNER",
    bStatus: "CONTENDING",
    bObserved: "state=1",
    queue: "uninitialized",
    activeZone: "b",
  },
  {
    short: "B 入队并 park",
    actor: "AQS",
    action: "AQS 初始化同步队列，把 Thread B 包装成节点追加到尾部",
    explanation:
      "B 入队后被 park，不会持续空转；队首 dummy 节点用于组织后继等待者。",
    operation: "enqueue(Node(Thread B)); LockSupport.park()",
    change: "head/tail null → HEAD(dummy) → Node(B)；B → WAITING",
    route: "b-heap",
    token: "Node B",
    syncState: 1,
    owner: "Thread A",
    aStatus: "OWNER",
    bStatus: "WAITING",
    bObserved: "state=1",
    queue: "waiting-b",
    activeZone: "heap",
  },
  {
    short: "A 释放",
    actor: "Thread A",
    action: "A 清除 owner 并把 state 写回 0",
    explanation:
      "Mutex.tryRelease 先校验当前线程确实持锁；成功释放后 AQS 才检查并唤醒后继。",
    operation: "setExclusiveOwnerThread(null); setState(0)",
    change: "owner Thread A → —；state 1 → 0",
    route: "a-heap",
    token: "0",
    syncState: 0,
    owner: "—",
    aStatus: "RELEASED",
    bStatus: "WAITING",
    bObserved: "state=1",
    queue: "waiting-b",
    activeZone: "heap",
  },
  {
    short: "唤醒 B",
    actor: "AQS",
    action: "release 成功后，AQS unpark 队首的有效后继 Thread B",
    explanation:
      "unpark 只让 B 重新变为可运行；它还没有持锁，必须再次尝试获取。",
    operation: "LockSupport.unpark(Thread B)",
    change: "Thread B WAITING → RUNNABLE；state 仍是 0",
    route: "heap-b",
    token: "unpark",
    syncState: 0,
    owner: "—",
    aStatus: "RELEASED",
    bStatus: "RUNNABLE",
    bObserved: "state=0",
    queue: "waiting-b",
    activeZone: "b",
  },
  {
    short: "B 接棒",
    actor: "Thread B",
    action: "B 醒来后 CAS(0,1) 成功，成为新的独占持有者",
    explanation:
      "成功获取后 B 对应的节点成为新 head，旧 dummy 节点可以脱链回收。",
    operation: "compareAndSetState(0, 1); setHead(Node B)",
    change: "state 0 → 1；owner — → Thread B；head → Node(B)",
    route: "b-heap",
    token: "CAS✓",
    syncState: 1,
    owner: "Thread B",
    aStatus: "RELEASED",
    bStatus: "OWNER",
    bObserved: "state=0",
    queue: "head-b",
    activeZone: "heap",
  },
];

function AqsQueue({ state }: { state: AqsQueueState }) {
  if (state === "uninitialized") {
    return (
      <div className="aqs-queue is-empty">
        <code>head = null</code>
        <code>tail = null</code>
      </div>
    );
  }

  return (
    <div className="aqs-queue">
      <div className="aqs-node">
        <strong>{state === "head-b" ? "HEAD · Node(B)" : "HEAD · dummy"}</strong>
        <small>{state === "head-b" ? "Thread B owns lock" : "no thread"}</small>
      </div>
      {state === "waiting-b" ? (
        <>
          <b aria-hidden="true">→</b>
          <div className="aqs-node is-waiting">
            <strong>TAIL · Node(B)</strong>
            <small>Thread B · queued</small>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AqsMap({ step, stepIndex }: { step: AqsStep; stepIndex: number }) {
  const rightDirection: RouteDirection =
    step.route === "heap-b" ? "right" : "left";

  return (
    <>
      <MetadataStrip
        classNames="Mutex · Mutex.Sync · AbstractQueuedSynchronizer"
        instruction="tryAcquire/tryRelease 的方法代码在元空间；state、owner 与队列节点在堆中。"
      />
      <div className="system-flow-grid system-grid-five">
        <SystemZone
          title="Thread A 线程栈"
          subtitle="lock()/unlock() 调用"
          tone="thread"
          active={step.activeZone === "a"}
        >
          <ObjectBox title="A 栈帧" type="thread-local">
            <StateRow label="mutex" value="@M1" />
            <StateRow
              label="线程状态"
              value={step.aStatus}
              active={step.activeZone === "a"}
              tone={step.aStatus === "OWNER" ? "success" : "default"}
            />
          </ObjectBox>
        </SystemZone>

        <SystemLink
          active={step.route === "a-heap"}
          label={step.short === "A 释放" ? "release" : "tryAcquire"}
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="堆 / Mutex @M1 → Sync(AQS) @S1"
          subtitle="同步状态与等待队列共享"
          tone="sync"
          active={step.activeZone === "heap"}
          className="system-wide-zone"
        >
          <ObjectBox
            title="AQS 同步状态"
            type="exclusive synchronizer"
            active={step.activeZone === "heap"}
          >
            <StateRow
              label="volatile int state"
              value={step.syncState}
              active={step.short === "A 获取" || step.short === "A 释放" || step.short === "B 接棒"}
            />
            <StateRow label="exclusiveOwnerThread" value={step.owner} />
          </ObjectBox>
          <div className="system-structure-block">
            <header>
              <strong>CLH 同步队列（逻辑结构）</strong>
              <span>双向链接省略，只画获取方向</span>
            </header>
            <AqsQueue state={step.queue} />
          </div>
          <div className="system-protected-resource">
            <span>受保护资源</span>
            <strong>{step.owner === "—" ? "无人访问" : `${step.owner} 可访问`}</strong>
          </div>
        </SystemZone>

        <SystemLink
          active={step.route === "b-heap" || step.route === "heap-b"}
          direction={rightDirection}
          label={step.route === "heap-b" ? "unpark" : "CAS / enqueue"}
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="Thread B 线程栈"
          subtitle="竞争者 / 等待者"
          tone="thread"
          active={step.activeZone === "b"}
        >
          <ObjectBox title="B 栈帧" type="thread-local">
            <StateRow label="mutex" value="@M1" />
            <StateRow label="observed" value={step.bObserved} />
            <StateRow
              label="线程状态"
              value={step.bStatus}
              active={step.activeZone === "b"}
              tone={
                step.bStatus === "OWNER"
                  ? "success"
                  : step.bStatus === "WAITING"
                    ? "warning"
                    : "default"
              }
            />
          </ObjectBox>
        </SystemZone>
      </div>
    </>
  );
}

type PipelineStep = RuntimeStep & {
  cache: string;
  cacheSize: 0 | 1;
  queue: readonly [string, string, string];
  putIndex: 0 | 1 | 2;
  takeIndex: 0 | 1 | 2;
  count: 0 | 1 | 2 | 3;
  producerStatus: "RUNNABLE" | "LOADING" | "WAITING";
  consumerStatus: "WAITING" | "RUNNABLE" | "PROCESSING J1";
  activeZone: "producer" | "heap" | "consumer";
};

const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    short: "容器为空",
    actor: "共享堆",
    action: "ConcurrentHashMap 与容量为 3 的 ArrayBlockingQueue 已创建",
    explanation:
      "Map 和队列对象在堆中；生产者、消费者只把当前 key 或 item 放在自己的栈里。",
    operation: "new ConcurrentHashMap<>(); new ArrayBlockingQueue<>(3)",
    change: "cache.size=0；queue.count=0；putIndex=takeIndex=0",
    route: "none",
    cache: "bin[hash(42)] = empty",
    cacheSize: 0,
    queue: ["—", "—", "—"],
    putIndex: 0,
    takeIndex: 0,
    count: 0,
    producerStatus: "RUNNABLE",
    consumerStatus: "WAITING",
    activeZone: "heap",
  },
  {
    short: "原子加载",
    actor: "producer",
    action: "生产者用 computeIfAbsent 为 key=42 建立映射",
    explanation:
      "容器把“检查缺失 + 建立映射”作为同 key 的原子过程，避免两个线程各自加载后再 put。",
    operation: "cache.computeIfAbsent(42, loader)",
    change: "producer.key=42；目标 bin 进入映射计算过程",
    route: "producer-heap",
    token: "k=42",
    cache: "bin[hash(42)] = loading…",
    cacheSize: 0,
    queue: ["—", "—", "—"],
    putIndex: 0,
    takeIndex: 0,
    count: 0,
    producerStatus: "LOADING",
    consumerStatus: "WAITING",
    activeZone: "producer",
  },
  {
    short: "写入 Map",
    actor: "ConcurrentHashMap",
    action: "加载结果 Profile-A 被发布为 key=42 的唯一映射",
    explanation:
      "后续 get(42) 可直接读取这个 value；这里不承诺对多个不同 key 的复合业务规则原子。",
    operation: "bin[hash(42)] : 42 → Profile-A",
    change: "cache.size 0 → 1；producer.item → Job(Profile-A)",
    route: "producer-heap",
    token: "value",
    cache: "42 → Profile-A",
    cacheSize: 1,
    queue: ["—", "—", "—"],
    putIndex: 0,
    takeIndex: 0,
    count: 0,
    producerStatus: "RUNNABLE",
    consumerStatus: "WAITING",
    activeZone: "heap",
  },
  {
    short: "放入 J1",
    actor: "producer",
    action: "queue.put(J1) 把第一条任务写入 items[0]",
    explanation:
      "put 在队列内部锁保护下更新数组槽、putIndex 和 count，并通过 notEmpty 唤醒消费者。",
    operation: "queue.put(J1)",
    change: "items[0] — → J1；putIndex 0 → 1；count 0 → 1",
    route: "producer-heap",
    token: "J1",
    cache: "42 → Profile-A",
    cacheSize: 1,
    queue: ["J1", "—", "—"],
    putIndex: 1,
    takeIndex: 0,
    count: 1,
    producerStatus: "RUNNABLE",
    consumerStatus: "RUNNABLE",
    activeZone: "heap",
  },
  {
    short: "队满反压",
    actor: "producer",
    action: "J2、J3 填满队列；生产者尝试 put(J4) 后等待 notFull",
    explanation:
      "容量达到 3 后不会继续占用新内存，生产速度被反压到生产者线程。",
    operation: "while (count == items.length) notFull.await()",
    change: "queue=[J1,J2,J3]；count=3；producer RUNNABLE → WAITING",
    route: "producer-heap",
    token: "J4×",
    cache: "42 → Profile-A",
    cacheSize: 1,
    queue: ["J1", "J2", "J3"],
    putIndex: 0,
    takeIndex: 0,
    count: 3,
    producerStatus: "WAITING",
    consumerStatus: "RUNNABLE",
    activeZone: "producer",
  },
  {
    short: "消费 J1",
    actor: "consumer",
    action: "consumer.take() 清空 items[0]，并 signal notFull",
    explanation:
      "takeIndex 循环前进，count 减一；生产者获得继续竞争内部锁的机会。",
    operation: "J1 = queue.take(); notFull.signal()",
    change: "items[0] J1 → —；takeIndex 0 → 1；count 3 → 2",
    route: "heap-consumer",
    token: "J1",
    cache: "42 → Profile-A",
    cacheSize: 1,
    queue: ["—", "J2", "J3"],
    putIndex: 0,
    takeIndex: 1,
    count: 2,
    producerStatus: "RUNNABLE",
    consumerStatus: "PROCESSING J1",
    activeZone: "consumer",
  },
  {
    short: "生产者恢复",
    actor: "producer",
    action: "生产者重新获得队列锁，把等待中的 J4 写入空槽 0",
    explanation:
      "数组是循环缓冲区，所以 putIndex 从 0 写入后前进到 1；容量依然严格等于 3。",
    operation: "enqueue(J4); putIndex = inc(0)",
    change: "items[0] — → J4；putIndex 0 → 1；count 2 → 3",
    route: "producer-heap",
    token: "J4",
    cache: "42 → Profile-A",
    cacheSize: 1,
    queue: ["J4", "J2", "J3"],
    putIndex: 1,
    takeIndex: 1,
    count: 3,
    producerStatus: "RUNNABLE",
    consumerStatus: "PROCESSING J1",
    activeZone: "heap",
  },
];

function PipelineMap({
  step,
  stepIndex,
}: {
  step: PipelineStep;
  stepIndex: number;
}) {
  return (
    <>
      <MetadataStrip
        classNames="ConcurrentCache · ConcurrentHashMap · ArrayBlockingQueue"
        instruction="容器方法代码在元空间；table、items[]、索引、计数和条件队列都属于堆对象状态。"
      />
      <div className="system-flow-grid system-grid-five">
        <SystemZone
          title="producer 线程栈"
          subtitle="key / item 只归生产者"
          tone="thread"
          active={step.activeZone === "producer"}
        >
          <ObjectBox title="produce() 栈帧" type="thread-local">
            <StateRow label="key" value="42" />
            <StateRow
              label="next item"
              value={step.short === "队满反压" || step.short === "生产者恢复" ? "J4" : "J1"}
            />
            <StateRow
              label="线程状态"
              value={step.producerStatus}
              active={step.activeZone === "producer"}
              tone={step.producerStatus === "WAITING" ? "warning" : "default"}
            />
          </ObjectBox>
        </SystemZone>

        <SystemLink
          active={step.route === "producer-heap"}
          label={step.short.includes("Map") || step.short === "原子加载" ? "computeIfAbsent" : "queue.put"}
          token={step.token}
          stepIndex={stepIndex}
          tone={step.short === "队满反压" ? "warning" : "default"}
        />

        <SystemZone
          title="堆 / 共享容器"
          subtitle="多线程共享 · 内部同步"
          tone="heap"
          active={step.activeZone === "heap"}
          className="system-wide-zone"
        >
          <ObjectBox
            title="ConcurrentHashMap @M1"
            type="table / bin"
            active={step.short === "写入 Map"}
          >
            <StateRow label="target bin" value={step.cache} />
            <StateRow label="mappingCount" value={step.cacheSize} />
          </ObjectBox>
          <div className="system-structure-block queue-structure">
            <header>
              <strong>ArrayBlockingQueue @Q1</strong>
              <span>items.length = 3 · 循环数组</span>
            </header>
            <div className="queue-slots">
              {step.queue.map((item, index) => (
                <div
                  className={`${item !== "—" ? "is-filled" : ""} ${
                    (step.short === "放入 J1" && index === 0) ||
                    (step.short === "消费 J1" && index === 0) ||
                    (step.short === "生产者恢复" && index === 0)
                      ? "is-changing"
                      : ""
                  }`}
                  key={`${index}-${item}`}
                >
                  <small>items[{index}]</small>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
            <div className="queue-indexes">
              <code>putIndex={step.putIndex}</code>
              <code>takeIndex={step.takeIndex}</code>
              <code>count={step.count}</code>
            </div>
            <div className="queue-conditions">
              <span>notEmpty</span>
              <span className={step.producerStatus === "WAITING" ? "is-waiting" : ""}>
                notFull {step.producerStatus === "WAITING" ? "← producer" : ""}
              </span>
            </div>
          </div>
        </SystemZone>

        <SystemLink
          active={step.route === "heap-consumer"}
          label="queue.take"
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="consumer 线程栈"
          subtitle="取走后在本地处理"
          tone="thread"
          active={step.activeZone === "consumer"}
        >
          <ObjectBox title="consume() 栈帧" type="thread-local">
            <StateRow
              label="message"
              value={step.consumerStatus === "PROCESSING J1" ? "J1" : "—"}
            />
            <StateRow
              label="线程状态"
              value={step.consumerStatus}
              active={step.activeZone === "consumer"}
              tone={step.consumerStatus === "PROCESSING J1" ? "success" : "default"}
            />
          </ObjectBox>
        </SystemZone>
      </div>
    </>
  );
}

type PoolStep = RuntimeStep & {
  workerCount: 0 | 1 | 2;
  workerOne: string;
  workerTwo: string;
  queue: "—" | "T2";
  queueCount: 0 | 1;
  submitTask: "—" | "T1" | "T2" | "T3" | "T4";
  callerResult: string;
  completed: 0 | 3;
  rejected: 0 | 1;
  runState: "RUNNING" | "SHUTDOWN" | "TERMINATED";
  activeZone: "submitter" | "pool" | "caller";
};

const POOL_STEPS: readonly PoolStep[] = [
  {
    short: "线程池为空",
    actor: "共享堆",
    action: "创建 core=1、max=2、workQueue.capacity=1 的线程池",
    explanation:
      "ThreadPoolExecutor、Worker 集合和 workQueue 在堆中；真正执行任务的是各 Worker 绑定的平台线程栈。",
    operation: "new InstrumentedThreadPool(1, 2, 1, ...)",
    change: "runState=RUNNING；workerCount=0；queue.count=0",
    route: "none",
    workerCount: 0,
    workerOne: "未创建",
    workerTwo: "未创建",
    queue: "—",
    queueCount: 0,
    submitTask: "—",
    callerResult: "—",
    completed: 0,
    rejected: 0,
    runState: "RUNNING",
    activeZone: "pool",
  },
  {
    short: "T1 建核心线程",
    actor: "submitter",
    action: "workerCount < corePoolSize，T1 直接创建核心 Worker-1",
    explanation:
      "第一条接纳路径不会先入队；Worker 对象进入 workers 集合，绑定线程开始执行 T1。",
    operation: "addWorker(T1, true)",
    change: "workerCount 0 → 1；Worker-1 → RUNNING T1",
    route: "submit-pool",
    token: "T1",
    workerCount: 1,
    workerOne: "RUNNING T1",
    workerTwo: "未创建",
    queue: "—",
    queueCount: 0,
    submitTask: "T1",
    callerResult: "accepted",
    completed: 0,
    rejected: 0,
    runState: "RUNNING",
    activeZone: "pool",
  },
  {
    short: "T2 入队",
    actor: "submitter",
    action: "核心线程已满，workQueue.offer(T2) 成功",
    explanation:
      "线程池仍是 RUNNING，T2 保存在容量为 1 的队列槽中等待 Worker 获取。",
    operation: "workQueue.offer(T2) == true",
    change: "queue[0] — → T2；queue.count 0 → 1",
    route: "submit-pool",
    token: "T2",
    workerCount: 1,
    workerOne: "RUNNING T1",
    workerTwo: "未创建",
    queue: "T2",
    queueCount: 1,
    submitTask: "T2",
    callerResult: "accepted",
    completed: 0,
    rejected: 0,
    runState: "RUNNING",
    activeZone: "pool",
  },
  {
    short: "T3 建非核心线程",
    actor: "submitter",
    action: "队列已满且 workerCount < maximumPoolSize，创建 Worker-2",
    explanation:
      "T3 不插入已经满的队列，而是作为 firstTask 交给新增的非核心 Worker。",
    operation: "offer(T3) == false; addWorker(T3, false)",
    change: "workerCount 1 → 2；Worker-2 → RUNNING T3；queue 仍保存 T2",
    route: "submit-pool",
    token: "T3",
    workerCount: 2,
    workerOne: "RUNNING T1",
    workerTwo: "RUNNING T3",
    queue: "T2",
    queueCount: 1,
    submitTask: "T3",
    callerResult: "accepted",
    completed: 0,
    rejected: 0,
    runState: "RUNNING",
    activeZone: "pool",
  },
  {
    short: "T4 被拒绝",
    actor: "submitter",
    action: "队列仍满且 workerCount 已达 max，拒绝策略处理 T4",
    explanation:
      "容量边界同时生效：不会无限增线程，也不会无限堆任务；AbortPolicy 抛出 RejectedExecutionException。",
    operation: "reject(T4)",
    change: "accepted 保持 3；rejected 0 → 1；T4 从未进入队列",
    route: "pool-caller",
    token: "REJECT",
    workerCount: 2,
    workerOne: "RUNNING T1",
    workerTwo: "RUNNING T3",
    queue: "T2",
    queueCount: 1,
    submitTask: "T4",
    callerResult: "RejectedExecutionException",
    completed: 0,
    rejected: 1,
    runState: "RUNNING",
    activeZone: "caller",
  },
  {
    short: "Worker 取队列",
    actor: "worker thread",
    action: "阻塞任务释放后，某个空闲 Worker 从 workQueue 取得 T2",
    explanation:
      "具体由 Worker-1 还是 Worker-2 取得取决于调度；图中展示 Worker-1 取得 T2 的一种合法时序。",
    operation: "task = workQueue.take(); task.run()",
    change: "queue[0] T2 → —；Worker-1 → RUNNING T2",
    route: "pool-caller",
    token: "done",
    workerCount: 2,
    workerOne: "RUNNING T2",
    workerTwo: "T3 DONE",
    queue: "—",
    queueCount: 0,
    submitTask: "—",
    callerResult: "3 tasks completing",
    completed: 0,
    rejected: 1,
    runState: "RUNNING",
    activeZone: "pool",
  },
  {
    short: "关闭完成",
    actor: "pool lifecycle",
    action: "shutdown 后不再接收新任务，已接纳任务完成，Worker 退出",
    explanation:
      "最终有 3 个任务完成、1 个任务被拒绝；线程池生命周期和容量结果都可被指标记录。",
    operation: "shutdown(); awaitTermination(...)",
    change: "runState RUNNING → TERMINATED；workerCount 2 → 0；completed=3",
    route: "pool-caller",
    token: "metrics",
    workerCount: 0,
    workerOne: "EXITED",
    workerTwo: "EXITED",
    queue: "—",
    queueCount: 0,
    submitTask: "—",
    callerResult: "completed=3 · rejected=1",
    completed: 3,
    rejected: 1,
    runState: "TERMINATED",
    activeZone: "caller",
  },
];

function PoolMap({ step, stepIndex }: { step: PoolStep; stepIndex: number }) {
  return (
    <>
      <MetadataStrip
        classNames="ThreadPoolExecutor · Worker · BlockingQueue · Runnable"
        instruction="线程池控制字段、Worker 对象和任务队列在堆中；每个 worker thread 拥有独立调用栈。"
      />
      <div className="system-flow-grid system-grid-five">
        <SystemZone
          title="submitter 线程栈"
          subtitle="调用 execute(task)"
          tone="thread"
          active={step.activeZone === "submitter"}
        >
          <ObjectBox title="execute() 栈帧" type="caller thread">
            <StateRow
              label="task"
              value={step.submitTask}
              active={step.route === "submit-pool"}
            />
            <StateRow label="executor" value="@E1" />
          </ObjectBox>
        </SystemZone>

        <SystemLink
          active={step.route === "submit-pool"}
          label="execute / submit"
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="堆 / ThreadPoolExecutor @E1"
          subtitle="接纳状态、Worker 集合与队列"
          tone="sync"
          active={step.activeZone === "pool"}
          className="system-wide-zone"
        >
          <ObjectBox
            title="ctl（逻辑拆分）"
            type="runState + workerCount"
            active={step.short === "关闭完成"}
          >
            <StateRow label="runState" value={step.runState} />
            <StateRow label="workerCount" value={step.workerCount} />
            <StateRow label="core / max" value="1 / 2" />
          </ObjectBox>
          <div className="pool-worker-grid">
            <div>
              <header>
                <strong>Worker @W1（堆）</strong>
                <span>绑定 platform thread-1 栈</span>
              </header>
              <code>{step.workerOne}</code>
            </div>
            <div>
              <header>
                <strong>Worker @W2（堆）</strong>
                <span>绑定 platform thread-2 栈</span>
              </header>
              <code>{step.workerTwo}</code>
            </div>
          </div>
          <div className="system-structure-block pool-queue">
            <header>
              <strong>workQueue @Q1</strong>
              <span>capacity=1</span>
            </header>
            <div className={step.queue !== "—" ? "is-filled" : ""}>
              <small>queue[0]</small>
              <strong>{step.queue}</strong>
            </div>
          </div>
        </SystemZone>

        <SystemLink
          active={step.route === "pool-caller"}
          label={step.short === "T4 被拒绝" ? "拒绝异常" : "完成 / 指标"}
          token={step.token}
          stepIndex={stepIndex}
          tone={step.short === "T4 被拒绝" ? "danger" : "success"}
        />

        <SystemZone
          title="调用结果与指标"
          subtitle="提交线程 / 监控读取"
          tone={step.rejected > 0 ? "danger" : "result"}
          active={step.activeZone === "caller"}
        >
          <ObjectBox title="admission result" type="observable state">
            <StateRow
              label="本次结果"
              value={step.callerResult}
              active={step.activeZone === "caller"}
              tone={step.short === "T4 被拒绝" ? "danger" : "default"}
            />
            <StateRow label="completed" value={step.completed} />
            <StateRow
              label="rejected"
              value={step.rejected}
              tone={step.rejected > 0 ? "danger" : "default"}
            />
          </ObjectBox>
        </SystemZone>
      </div>
    </>
  );
}

type OutcomeValue = "—" | "SUCCESS" | "TIMED_OUT";

type ReliabilityStep = RuntimeStep & {
  budget: string;
  permits: 0 | 1 | 2;
  activeCalls: 0 | 1 | 2;
  profile: string;
  inventory: string;
  recommendation: string;
  outcomes: readonly [OutcomeValue, OutcomeValue, OutcomeValue];
  response: string;
  activeZone: "request" | "service" | "downstream" | "result";
};

const RELIABILITY_STEPS: readonly ReliabilityStep[] = [
  {
    short: "建立总预算",
    actor: "request thread",
    action: "聚合请求创建 800ms 的 DeadlineBudget 和固定长度 outcomes[]",
    explanation:
      "deadline 是整组调用共用的绝对截止时间；不是给每个 Future 重新等待 800ms。",
    operation: "DeadlineBudget.after(Duration.ofMillis(800))",
    change: "budget=800ms；outcomes=[null,null,null]；permits=2",
    route: "request-service",
    token: "R42",
    budget: "800ms",
    permits: 2,
    activeCalls: 0,
    profile: "NOT_SUBMITTED",
    inventory: "NOT_SUBMITTED",
    recommendation: "NOT_SUBMITTED",
    outcomes: ["—", "—", "—"],
    response: "—",
    activeZone: "request",
  },
  {
    short: "提交三路调用",
    actor: "AggregationService",
    action: "为三个 DownstreamCall 建立 Future 和超时定时器",
    explanation:
      "Future、定时器和 outcomes[] 都是堆中的请求状态；数组索引保存原始调用顺序。",
    operation: "workers.submit(...); timeoutScheduler.schedule(...)",
    change: "pending=[profile, inventory, recommendation]；outcomes 仍为空",
    route: "service-downstream",
    token: "3 calls",
    budget: "≈790ms",
    permits: 2,
    activeCalls: 0,
    profile: "SUBMITTED",
    inventory: "SUBMITTED",
    recommendation: "SUBMITTED",
    outcomes: ["—", "—", "—"],
    response: "—",
    activeZone: "service",
  },
  {
    short: "Bulkhead 限流",
    actor: "worker tasks",
    action: "profile 与 inventory 取得两个许可，recommendation 在许可队列等待",
    explanation:
      "线程或虚拟线程可以很多，但 Semaphore 把真实下游并发严格限制为 2。",
    operation: "resourcePermits.acquire()",
    change: "permits 2 → 0；activeCalls 0 → 2；recommendation → WAITING",
    route: "service-downstream",
    token: "permit",
    budget: "≈760ms",
    permits: 0,
    activeCalls: 2,
    profile: "RUNNING",
    inventory: "RUNNING",
    recommendation: "WAITING_PERMIT",
    outcomes: ["—", "—", "—"],
    response: "—",
    activeZone: "downstream",
  },
  {
    short: "profile 成功",
    actor: "profile worker",
    action: "关键调用 profile 成功，结果写入 outcomes[0] 并归还许可",
    explanation:
      "finally 中释放 Semaphore，等待中的 recommendation 随后取得许可开始运行。",
    operation: "outcomes[0] = CallOutcome.success(...); permits.release()",
    change: "outcomes[0] — → SUCCESS；recommendation WAITING → RUNNING",
    route: "downstream-result",
    token: "OK",
    budget: "≈600ms",
    permits: 0,
    activeCalls: 2,
    profile: "SUCCESS",
    inventory: "RUNNING",
    recommendation: "RUNNING",
    outcomes: ["SUCCESS", "—", "—"],
    response: "—",
    activeZone: "result",
  },
  {
    short: "inventory 超时",
    actor: "timeout scheduler",
    action: "inventory 的定时器取消 Future，worker 响应中断并释放许可",
    explanation:
      "终态被明确记录为 TIMED_OUT，而不是把超时、取消和业务失败混成同一种异常。",
    operation: "timeoutTriggered=true; future.cancel(true)",
    change: "outcomes[1] — → TIMED_OUT；activeCalls 2 → 1；permits 0 → 1",
    route: "downstream-result",
    token: "TIMEOUT",
    budget: "≈300ms",
    permits: 1,
    activeCalls: 1,
    profile: "SUCCESS",
    inventory: "TIMED_OUT",
    recommendation: "RUNNING",
    outcomes: ["SUCCESS", "TIMED_OUT", "—"],
    response: "—",
    activeZone: "result",
  },
  {
    short: "recommendation 成功",
    actor: "recommendation worker",
    action: "非关键 recommendation 完成，结果写入 outcomes[2]",
    explanation:
      "结果仍按调用原始索引保存，不受并发完成顺序影响；最后一个许可被归还。",
    operation: "outcomes[2] = CallOutcome.success(...); permits.release()",
    change: "outcomes[2] — → SUCCESS；activeCalls 1 → 0；permits 1 → 2",
    route: "downstream-result",
    token: "OK",
    budget: "≈180ms",
    permits: 2,
    activeCalls: 0,
    profile: "SUCCESS",
    inventory: "TIMED_OUT",
    recommendation: "SUCCESS",
    outcomes: ["SUCCESS", "TIMED_OUT", "SUCCESS"],
    response: "—",
    activeZone: "result",
  },
  {
    short: "返回降级响应",
    actor: "request thread",
    action: "聚合成功值和失败原因，返回 degraded=true 的部分结果",
    explanation:
      "关键 profile 成功，因此请求可以保留两个成功值；超时原因与计数同时进入可观测结果。",
    operation: "new AggregationResponse(outcomes, elapsed)",
    change: "response=PARTIAL；success=2；timedOut=1；maxActive=2",
    route: "result-response",
    token: "PARTIAL",
    budget: "≈150ms",
    permits: 2,
    activeCalls: 0,
    profile: "SUCCESS",
    inventory: "TIMED_OUT",
    recommendation: "SUCCESS",
    outcomes: ["SUCCESS", "TIMED_OUT", "SUCCESS"],
    response: "PARTIAL · degraded=true",
    activeZone: "result",
  },
];

function OutcomeCell({
  name,
  value,
  critical,
}: {
  name: string;
  value: OutcomeValue;
  critical?: boolean;
}) {
  return (
    <div
      className={`outcome-cell ${
        value === "SUCCESS"
          ? "is-success"
          : value === "TIMED_OUT"
            ? "is-timeout"
            : ""
      }`}
    >
      <span>
        {name}
        {critical ? " · critical" : ""}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function ReliabilityMap({
  step,
  stepIndex,
}: {
  step: ReliabilityStep;
  stepIndex: number;
}) {
  return (
    <>
      <MetadataStrip
        classNames="AggregationService · Future · Semaphore · AggregationResponse"
        instruction="预算、Future、许可计数、outcomes[] 与指标在堆中；每个下游任务有自己的执行栈。"
      />
      <div className="system-flow-grid system-grid-seven">
        <SystemZone
          title="request 线程栈"
          subtitle="一次请求的入口"
          tone="thread"
          active={step.activeZone === "request"}
        >
          <ObjectBox title="aggregate() 栈帧" type="request-local">
            <StateRow label="calls" value="[P, I, R]" />
            <StateRow
              label="remaining"
              value={step.budget}
              active={step.activeZone === "request"}
            />
          </ObjectBox>
        </SystemZone>

        <SystemLink
          active={step.route === "request-service"}
          label="调用计划 + deadline"
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="堆 / AggregationService @A1"
          subtitle="请求状态与容量闸门"
          tone="sync"
          active={step.activeZone === "service"}
        >
          <ObjectBox title="DeadlineBudget" type="shared request state">
            <StateRow label="remaining" value={step.budget} />
          </ObjectBox>
          <ObjectBox
            title="Semaphore @S1"
            type="resourceCapacity=2"
            active={step.short === "Bulkhead 限流"}
          >
            <StateRow label="availablePermits" value={step.permits} />
            <StateRow label="activeCalls" value={step.activeCalls} />
          </ObjectBox>
        </SystemZone>

        <SystemLink
          active={step.route === "service-downstream"}
          label="submit / acquire"
          token={step.token}
          stepIndex={stepIndex}
        />

        <SystemZone
          title="下游任务与执行栈"
          subtitle="完成、超时或等待许可"
          tone="thread"
          active={step.activeZone === "downstream"}
          className="downstream-zone"
        >
          <div className="downstream-calls">
            <StateRow label="profile · critical" value={step.profile} />
            <StateRow label="inventory · optional" value={step.inventory} />
            <StateRow
              label="recommendation · optional"
              value={step.recommendation}
            />
          </div>
        </SystemZone>

        <SystemLink
          active={step.route === "downstream-result"}
          label="CallOutcome"
          token={step.token}
          stepIndex={stepIndex}
          tone={step.short === "inventory 超时" ? "warning" : "success"}
        />

        <SystemZone
          title="outcomes[] 与响应"
          subtitle="原顺序收集 + 指标"
          tone="result"
          active={step.activeZone === "result"}
        >
          <div className="outcome-array">
            <OutcomeCell name="[0] profile" value={step.outcomes[0]} critical />
            <OutcomeCell name="[1] inventory" value={step.outcomes[1]} />
            <OutcomeCell name="[2] recommendation" value={step.outcomes[2]} />
          </div>
          <ObjectBox
            title="AggregationResponse"
            type="immutable result"
            active={step.short === "返回降级响应"}
          >
            <StateRow
              label="status"
              value={step.response}
              tone={step.response.startsWith("PARTIAL") ? "warning" : "default"}
            />
          </ObjectBox>
          {step.route === "result-response" ? (
            <div className="response-packet" key={`response-${stepIndex}`}>
              PARTIAL
            </div>
          ) : null}
        </SystemZone>
      </div>
    </>
  );
}

export default function LessonRuntimeLab({
  lessonNumber,
}: {
  lessonNumber: string;
}) {
  if (lessonNumber === "02") {
    return (
      <RuntimeLabFrame
        lessonNumber="02"
        title="不可变配置的安全发布"
        mapCaption="writer 栈 → 堆对象 → volatile 引用 → reader 栈"
        steps={PUBLICATION_STEPS}
        metrics={(step) => [
          { label: "current", value: step.current },
          {
            label: "reader",
            value: step.readerRef,
            tone: step.readerRef === "@S1" ? "success" : "default",
          },
          {
            label: "一致快照",
            value: step.consistent,
            tone: step.consistent === "是" ? "success" : "default",
          },
        ]}
        footnote="图中 @S0/@S1 是对象身份的教学标记。volatile 发布的是引用；Settings 的 final 字段不会在发布后原地修改。"
        renderMap={(step, stepIndex) => (
          <PublicationMap step={step} stepIndex={stepIndex} />
        )}
      />
    );
  }

  if (lessonNumber === "03") {
    return (
      <RuntimeLabFrame
        lessonNumber="03"
        title="Mutex / AQS 的一次锁交接"
        mapCaption="线程 CAS 竞争 · AQS 队列入队 · park/unpark · 再次获取"
        steps={AQS_STEPS}
        metrics={(step) => [
          { label: "AQS.state", value: step.syncState },
          {
            label: "owner",
            value: step.owner,
            tone: step.owner === "—" ? "default" : "success",
          },
          {
            label: "Thread B",
            value: step.bStatus,
            tone: step.bStatus === "WAITING" ? "warning" : "default",
          },
        ]}
        footnote="这是项目 Mutex（不可重入独占锁）的一次合法时序。队列省略双向链接和 JDK 内部状态位；lockInterruptibly 的取消路径在源码练习中单独学习。"
        renderMap={(step, stepIndex) => (
          <AqsMap step={step} stepIndex={stepIndex} />
        )}
      />
    );
  }

  if (lessonNumber === "04") {
    return (
      <RuntimeLabFrame
        lessonNumber="04"
        title="并发 Map 与有界队列的数据通道"
        mapCaption="同 key 原子建立映射 · 环形数组存储 · 队满阻塞形成背压"
        steps={PIPELINE_STEPS}
        metrics={(step) => [
          { label: "cache.size", value: step.cacheSize },
          {
            label: "queue",
            value: `${step.count}/3`,
            tone: step.count === 3 ? "warning" : "default",
          },
          {
            label: "producer",
            value: step.producerStatus,
            tone: step.producerStatus === "WAITING" ? "warning" : "default",
          },
        ]}
        footnote="图以项目 ConcurrentCache 和 ArrayBlockingQueue 为依据。ConcurrentHashMap 的具体 bin 实现会随 JDK 版本变化；这里承诺的是 API 原子语义，不依赖私有实现。"
        renderMap={(step, stepIndex) => (
          <PipelineMap step={step} stepIndex={stepIndex} />
        )}
      />
    );
  }

  if (lessonNumber === "05") {
    return (
      <RuntimeLabFrame
        lessonNumber="05"
        title="ThreadPoolExecutor 的四条接纳路径"
        mapCaption="核心 Worker → 入队 → 非核心 Worker → 拒绝"
        steps={POOL_STEPS}
        metrics={(step) => [
          { label: "workers", value: `${step.workerCount}/2` },
          { label: "queue", value: `${step.queueCount}/1` },
          {
            label: "rejected",
            value: step.rejected,
            tone: step.rejected > 0 ? "danger" : "default",
          },
        ]}
        footnote="配置与 PoolSaturationDemo 一致：core=1、max=2、queue=1。第 6 步展示一种合法调度；Future、CompletableFuture 和虚拟线程通过本课其他源码继续学习。"
        renderMap={(step, stepIndex) => (
          <PoolMap step={step} stepIndex={stepIndex} />
        )}
      />
    );
  }

  return (
    <RuntimeLabFrame
      lessonNumber="06"
      title="有边界的多下游聚合请求"
      mapCaption="总 deadline · Semaphore bulkhead · 取消 · 原顺序结果 · 降级"
      steps={RELIABILITY_STEPS}
      metrics={(step) => [
        {
          label: "permits",
          value: `${step.permits}/2`,
          tone: step.permits === 0 ? "warning" : "default",
        },
        { label: "active", value: step.activeCalls },
        {
          label: "response",
          value: step.response,
          tone: step.response.startsWith("PARTIAL") ? "warning" : "default",
        },
      ]}
      footnote="800ms 与 capacity=2 是教学场景参数。终态名称、Semaphore 限流、Future 取消和 outcomes[] 原顺序收集均对应项目综合代码。"
      renderMap={(step, stepIndex) => (
        <ReliabilityMap step={step} stepIndex={stepIndex} />
      )}
    />
  );
}
