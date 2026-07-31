"use strict";

const STORAGE_KEYS = {
  theme: "juc-v3-theme",
  todos: "juc-v3-lesson01-todos",
};

const SOURCE_PATHS = {
  lostUpdate: "src/main/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemo.java",
  deadlock: "src/main/java/com/caesaemc/juc/v3/labs/lesson01/DeadlockDemo.java",
  demoMain: "src/main/java/com/caesaemc/juc/v3/labs/lesson01/Lesson01DemoMain.java",
  task: "src/main/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatistics.java",
  lostUpdateTest: "src/test/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemoTest.java",
  deadlockTest: "src/test/java/com/caesaemc/juc/v3/labs/lesson01/DeadlockDemoTest.java",
  taskAcceptance: "src/test/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatisticsAcceptance.java",
};

const NOTES_DOCUMENTS = {
  lesson: {
    title: "课程讲义",
    filename: "lesson01.md",
    url: "/docs/v3/lessons/lesson01.md",
  },
  review: {
    title: "学习记录",
    filename: "lesson01-review.md",
    url: "/docs/v3/lessons/lesson01-review.md",
  },
};

const raceSteps = [
  {
    label: "准备",
    kind: "观察目标",
    narration: "两个线程即将对同一个共享 counter 执行一次非原子的自增。",
    counter: 0,
    aSnapshot: null,
    aNext: null,
    bSnapshot: null,
    bNext: null,
    aAction: "等待调度",
    bAction: "等待调度",
  },
  {
    label: "A · READ",
    kind: "读取共享堆",
    narration: "线程 A 从堆读取 counter=0，形成线程私有的 snapshot。共享 counter 没有变化。",
    counter: 0,
    aSnapshot: 0,
    aNext: null,
    bSnapshot: null,
    bNext: null,
    active: "a",
    changed: "a-snapshot",
    flow: { side: "a", operation: "read", direction: "←", text: "read 0" },
    aAction: "read(counter) → 0",
    bAction: "等待调度",
    event: "A 读取 heap.counter=0 → A.snapshot=0",
    source: {
      path: SOURCE_PATHS.lostUpdate,
      match: "int localSnapshot = heapCounter.completedTasks;",
      description: "A 从共享字段形成线程私有快照",
    },
  },
  {
    label: "B · READ",
    kind: "读取同一旧值",
    narration: "线程 B 也读取 counter=0。A 的计算结果尚未写回，因此 B 得到同一份旧快照。",
    counter: 0,
    aSnapshot: 0,
    aNext: null,
    bSnapshot: 0,
    bNext: null,
    active: "b",
    changed: "b-snapshot",
    flow: { side: "b", operation: "read", direction: "→", text: "read 0" },
    aAction: "持有 snapshot=0",
    bAction: "read(counter) → 0",
    event: "B 读取 heap.counter=0 → B.snapshot=0",
    source: {
      path: SOURCE_PATHS.lostUpdate,
      match: "int localSnapshot = heapCounter.completedTasks;",
      description: "B 执行同一条读取语句",
    },
  },
  {
    label: "A · ADD",
    kind: "线程私有计算",
    narration: "线程 A 在自己的执行上下文中计算 snapshot + 1，得到 next=1；堆上的 counter 仍为 0。",
    counter: 0,
    aSnapshot: 0,
    aNext: 1,
    bSnapshot: 0,
    bNext: null,
    active: "a",
    changed: "a-next",
    aAction: "snapshot + 1 → next",
    bAction: "持有 snapshot=0",
    event: "A 在本地计算 0 + 1 → A.next=1",
    source: {
      path: SOURCE_PATHS.lostUpdate,
      match: "int valueToWrite = localSnapshot + 1;",
      description: "A 在局部变量中完成加一",
    },
  },
  {
    label: "B · ADD",
    kind: "另一个本地计算",
    narration: "线程 B 根据自己的旧快照也算出 next=1。两个 next 属于不同线程的私有执行上下文。",
    counter: 0,
    aSnapshot: 0,
    aNext: 1,
    bSnapshot: 0,
    bNext: 1,
    active: "b",
    changed: "b-next",
    aAction: "持有 next=1",
    bAction: "snapshot + 1 → next",
    event: "B 在本地计算 0 + 1 → B.next=1",
    source: {
      path: SOURCE_PATHS.lostUpdate,
      match: "int valueToWrite = localSnapshot + 1;",
      description: "B 根据自己的快照完成加一",
    },
  },
  {
    label: "A · WRITE",
    kind: "第一次写回",
    narration: "线程 A 把 next=1 写回共享堆，counter 从 0 变为 1。此时只完成了一次有效更新。",
    counter: 1,
    aSnapshot: 0,
    aNext: 1,
    bSnapshot: 0,
    bNext: 1,
    active: "heap",
    changed: "counter",
    flow: { side: "a", operation: "write", direction: "→", text: "write 1" },
    aAction: "write(next) → counter",
    bAction: "持有旧结果 next=1",
    event: "A 写入 A.next=1 → heap.counter 由 0 变为 1",
    source: {
      path: SOURCE_PATHS.lostUpdate,
      match: "heapCounter.completedTasks = valueToWrite;",
      description: "A 把局部结果写回共享字段",
    },
  },
  {
    label: "B · WRITE",
    kind: "覆盖发生",
    narration: "线程 B 再把同样的 next=1 写回，覆盖 A 的结果。执行了两次自增，counter 最终却只有 1。",
    counter: 1,
    aSnapshot: 0,
    aNext: 1,
    bSnapshot: 0,
    bNext: 1,
    active: "heap",
    changed: "counter",
    overwritten: true,
    flow: { side: "b", operation: "write", direction: "←", text: "overwrite 1" },
    aAction: "更新已被覆盖",
    bAction: "write(next) → counter",
    event: "B 写入 B.next=1 → 覆盖 A 的更新，发生 LOST UPDATE",
    source: {
      path: SOURCE_PATHS.lostUpdate,
      match: "heapCounter.completedTasks = valueToWrite;",
      description: "B 执行同一写回语句并覆盖 A",
    },
  },
];

const deadlockSteps = [
  {
    label: "准备",
    kind: "观察目标",
    narration: "两个线程将以相反顺序申请两把锁。死锁不是“很慢”，而是等待关系形成了环。",
    ownerOne: null,
    ownerTwo: null,
    aStatus: "RUNNABLE · 尚未持锁",
    bStatus: "RUNNABLE · 尚未持锁",
  },
  {
    label: "A · LOCK 1",
    kind: "占有资源",
    narration: "线程 A 成功获取任务注册表锁 Lock 1。owner 变为 A；此时没有等待边。",
    ownerOne: "A",
    ownerTwo: null,
    aStatus: "RUNNABLE · 持有 Lock 1",
    bStatus: "RUNNABLE · 尚未持锁",
    event: "A 获取 Lock 1，Lock 1.owner=A",
    source: {
      path: SOURCE_PATHS.deadlock,
      match: "synchronized (firstMonitor) {",
      description: "A 获取传入的第一把监视器",
    },
  },
  {
    label: "B · LOCK 2",
    kind: "交叉占有",
    narration: "线程 B 获取完成统计锁 Lock 2。现在 A、B 各持有一把锁，但仍未死锁。",
    ownerOne: "A",
    ownerTwo: "B",
    aStatus: "RUNNABLE · 持有 Lock 1",
    bStatus: "RUNNABLE · 持有 Lock 2",
    event: "B 获取 Lock 2，Lock 2.owner=B",
    source: {
      path: SOURCE_PATHS.deadlock,
      match: "synchronized (firstMonitor) {",
      description: "B 以相反参数顺序获取第一把监视器",
    },
  },
  {
    label: "A · WAIT 2",
    kind: "第一条等待边",
    narration: "线程 A 请求 Lock 2，但 owner 是 B。A 保留 Lock 1 并进入 BLOCKED，形成 A → B。",
    ownerOne: "A",
    ownerTwo: "B",
    aStatus: "BLOCKED · 持有 Lock 1，等待 Lock 2",
    bStatus: "RUNNABLE · 持有 Lock 2",
    waitA: true,
    event: "A 等待 B 持有的 Lock 2，wait-for 边 A → B",
    source: {
      path: SOURCE_PATHS.deadlock,
      match: "synchronized (secondMonitor) {",
      description: "A 尝试进入 B 持有的第二个监视器",
    },
  },
  {
    label: "B · WAIT 1",
    kind: "等待环闭合",
    narration: "线程 B 又请求 A 持有的 Lock 1，形成 B → A。A → B → A 构成环，双方都无法继续。",
    ownerOne: "A",
    ownerTwo: "B",
    aStatus: "BLOCKED · 持有 Lock 1，等待 Lock 2",
    bStatus: "BLOCKED · 持有 Lock 2，等待 Lock 1",
    waitA: true,
    waitB: true,
    cycle: true,
    event: "B 等待 A 持有的 Lock 1，A → B → A 闭环：DEADLOCK",
    source: {
      path: SOURCE_PATHS.deadlock,
      match: "synchronized (secondMonitor) {",
      description: "B 尝试第二把监视器，wait-for 环闭合",
    },
  },
];

const experiments = {
  race: {
    steps: raceSteps,
    timeline: ["A READ", "B READ", "A ADD", "B ADD", "A WRITE", "B WRITE"],
  },
  deadlock: {
    steps: deadlockSteps,
    timeline: ["A LOCK 1", "B LOCK 2", "A WAIT 2", "B WAIT 1"],
  },
};

const EXPECTED_SOURCES = [
  {
    role: "DEMO",
    path: SOURCE_PATHS.lostUpdate,
  },
  {
    role: "DEMO",
    path: SOURCE_PATHS.deadlock,
  },
  {
    role: "DEMO",
    path: SOURCE_PATHS.demoMain,
  },
  {
    role: "TASK",
    path: SOURCE_PATHS.task,
  },
  {
    role: "TEST",
    path: SOURCE_PATHS.lostUpdateTest,
  },
  {
    role: "TEST",
    path: SOURCE_PATHS.deadlockTest,
  },
  {
    role: "TEST",
    path: SOURCE_PATHS.taskAcceptance,
  },
];

const state = {
  activeExperiment: "race",
  stepByExperiment: { race: 0, deadlock: 0 },
  timer: null,
  sourceFiles: [],
  activeSourcePath: null,
  sourceSignature: "",
  linkedSource: null,
  sourceManualOverride: false,
  activeNotesDocument: "lesson",
  markdownDocuments: { lesson: "", review: "" },
  notesRequestId: 0,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Local storage may be unavailable in privacy modes; the page still works for this visit.
  }
}

function initTheme() {
  const storedTheme = safeStorageGet(STORAGE_KEYS.theme);
  applyTheme(storedTheme === "dark" ? "dark" : "light");
  $("#theme-toggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    safeStorageSet(STORAGE_KEYS.theme, nextTheme);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  const button = $("#theme-toggle");
  button.setAttribute("aria-pressed", String(dark));
  $(".theme-icon", button).textContent = dark ? "☀" : "☾";
  $(".theme-label", button).textContent = dark ? "明亮" : "深色";
}

function initTodos() {
  let saved = {};
  try {
    saved = JSON.parse(safeStorageGet(STORAGE_KEYS.todos) || "{}") || {};
  } catch {
    saved = {};
  }

  const inputs = $$("#todo-list input[data-todo]");
  inputs.forEach((input) => {
    input.checked = Boolean(saved[input.dataset.todo]);
    input.addEventListener("change", () => {
      const nextState = Object.fromEntries(inputs.map((item) => [item.dataset.todo, item.checked]));
      safeStorageSet(STORAGE_KEYS.todos, JSON.stringify(nextState));
      renderTodoProgress(inputs);
    });
  });
  renderTodoProgress(inputs);
}

function renderTodoProgress(inputs) {
  const complete = inputs.filter((input) => input.checked).length;
  $("#todo-count").textContent = `${complete} / ${inputs.length}`;
  $("#todo-progress").style.width = `${(complete / inputs.length) * 100}%`;
}

function initLab() {
  $$(".experiment-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchExperiment(tab.dataset.experiment));
  });
  $("#reset-button").addEventListener("click", resetExperiment);
  $("#previous-button").addEventListener("click", previousStep);
  $("#next-button").addEventListener("click", nextStep);
  $("#play-button").addEventListener("click", togglePlayback);
  $("#speed-select").addEventListener("change", () => {
    if (state.timer) {
      pausePlayback();
      startPlayback();
    }
  });
  $("#concurrency-lab").addEventListener("keydown", (event) => {
    if (event.target.closest("button, select, input, a")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextStep();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousStep();
    } else if (event.key === " ") {
      event.preventDefault();
      togglePlayback();
    }
  });
  renderExperiment();
}

function switchExperiment(experiment) {
  if (!experiments[experiment] || experiment === state.activeExperiment) return;
  pausePlayback();
  state.activeExperiment = experiment;
  $$(".experiment-tab").forEach((tab) => {
    const active = tab.dataset.experiment === experiment;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $("#experiment-stage").setAttribute("aria-labelledby", `tab-${experiment}`);
  renderExperiment();
}

function resetExperiment() {
  pausePlayback();
  state.stepByExperiment[state.activeExperiment] = 0;
  renderExperiment();
}

function previousStep() {
  pausePlayback();
  const current = state.stepByExperiment[state.activeExperiment];
  state.stepByExperiment[state.activeExperiment] = Math.max(0, current - 1);
  renderExperiment();
}

function nextStep({ fromPlayback = false } = {}) {
  const experiment = experiments[state.activeExperiment];
  const current = state.stepByExperiment[state.activeExperiment];
  if (current >= experiment.steps.length - 1) {
    if (fromPlayback) pausePlayback();
    return;
  }
  state.stepByExperiment[state.activeExperiment] = current + 1;
  renderExperiment();
  if (fromPlayback && state.stepByExperiment[state.activeExperiment] >= experiment.steps.length - 1) {
    pausePlayback();
    renderExperiment();
  }
}

function togglePlayback() {
  if (state.timer) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  const experiment = experiments[state.activeExperiment];
  if (state.stepByExperiment[state.activeExperiment] >= experiment.steps.length - 1) {
    state.stepByExperiment[state.activeExperiment] = 0;
    renderExperiment();
  }
  const delay = Number($("#speed-select").value) || 1000;
  state.timer = window.setInterval(() => nextStep({ fromPlayback: true }), delay);
  renderPlaybackState();
}

function pausePlayback() {
  if (state.timer) window.clearInterval(state.timer);
  state.timer = null;
  renderPlaybackState();
}

function renderPlaybackState() {
  const running = Boolean(state.timer);
  const playButton = $("#play-button");
  $("span", playButton).textContent = running ? "Ⅱ" : "▶";
  $("strong", playButton).textContent = running ? "暂停" : "播放";
  playButton.setAttribute("aria-label", running ? "暂停动画" : "播放动画");
  $(".status-dot").classList.toggle("is-running", running);
  $("#lab-status-text").textContent = running ? "正在播放" : "已暂停，可单步检查";
}

function renderExperiment() {
  const { activeExperiment } = state;
  const experiment = experiments[activeExperiment];
  const index = state.stepByExperiment[activeExperiment];
  const step = experiment.steps[index];

  $("#race-scene").hidden = activeExperiment !== "race";
  $("#deadlock-scene").hidden = activeExperiment !== "deadlock";
  $("#narration-kind").textContent = step.kind;
  $("#narration-text").textContent = step.narration;
  $("#step-label").textContent = step.label;
  $("#step-current").textContent = String(index);
  $("#step-total").textContent = String(experiment.steps.length - 1);
  $("#previous-button").disabled = index === 0;
  $("#next-button").disabled = index === experiment.steps.length - 1;

  if (activeExperiment === "race") renderRace(step, index);
  else renderDeadlock(step, index);
  renderTimeline(activeExperiment, index);
  renderEventLog(experiment.steps, index);
  syncSourceToAnimationStep(step, index);
  renderPlaybackState();
}

function renderRace(step) {
  $("#heap-counter").textContent = String(step.counter);
  $("#a-snapshot").textContent = step.aSnapshot ?? "—";
  $("#a-next").textContent = step.aNext ?? "—";
  $("#b-snapshot").textContent = step.bSnapshot ?? "—";
  $("#b-next").textContent = step.bNext ?? "—";
  $("#a-action").textContent = step.aAction;
  $("#b-action").textContent = step.bAction;

  const cards = {
    a: $("#thread-a-card"),
    b: $("#thread-b-card"),
    heap: $("#heap-card"),
  };
  Object.values(cards).forEach((card) => card.classList.remove("is-active"));
  if (cards[step.active]) cards[step.active].classList.add("is-active");
  $("#heap-card").classList.toggle("is-overwritten", Boolean(step.overwritten));

  $$('[data-field]').forEach((field) => field.classList.remove("is-changed"));
  if (step.changed && step.changed !== "counter") {
    const field = $(`[data-field="${step.changed}"]`);
    if (field) field.classList.add("is-changed");
  }

  setConnector("a", step.flow?.side === "a" ? step.flow : null);
  setConnector("b", step.flow?.side === "b" ? step.flow : null);
}

function setConnector(side, flow) {
  const connector = $(`#connector-${side}`);
  connector.classList.toggle("is-flowing", Boolean(flow));
  connector.classList.toggle("is-read", flow?.operation === "read");
  connector.classList.toggle("is-write", flow?.operation === "write");
  $(".flow-direction", connector).textContent = flow ? `━━${flow.direction}` : "·";
  $("small", connector).textContent = flow ? flow.text : "无数据流";
}

function renderDeadlock(step) {
  $("#lock-one-owner").textContent = step.ownerOne || "空闲";
  $("#lock-two-owner").textContent = step.ownerTwo || "空闲";
  $("#lock-one").classList.toggle("is-owned", Boolean(step.ownerOne));
  $("#lock-two").classList.toggle("is-owned", Boolean(step.ownerTwo));
  $("#dead-a-status").textContent = step.aStatus;
  $("#dead-b-status").textContent = step.bStatus;
  $("#dead-thread-a").classList.toggle("is-waiting", Boolean(step.waitA));
  $("#dead-thread-b").classList.toggle("is-waiting", Boolean(step.waitB));
  $("#wait-edge-a").classList.toggle("is-active", Boolean(step.waitA));
  $("#wait-edge-b").classList.toggle("is-active", Boolean(step.waitB));
  $("#cycle-diagram").classList.toggle("is-visible", Boolean(step.cycle));
  $(".wait-graph").classList.toggle("is-deadlocked", Boolean(step.cycle));
  $("#cycle-state").textContent = step.cycle ? "检测到 WAIT-FOR 环" : step.waitA ? "存在一条等待边" : "尚未成环";
}

function renderTimeline(experimentName, index) {
  const target = experimentName === "race" ? $("#race-timeline") : $("#deadlock-timeline");
  target.replaceChildren();
  experiments[experimentName].timeline.forEach((label, timelineIndex) => {
    const item = document.createElement("li");
    item.textContent = label;
    if (timelineIndex < index) item.classList.add("is-complete");
    if (timelineIndex === index - 1) item.classList.add("is-current");
    target.append(item);
  });
}

function renderEventLog(steps, index) {
  const log = $("#event-log");
  log.replaceChildren();
  steps.slice(1, index + 1).forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step.event;
    log.append(item);
  });
  if (index === 0) {
    const item = document.createElement("li");
    item.textContent = "等待第一条调度事件…";
    log.append(item);
  }
  $("#event-count").textContent = `${index} ${index === 1 ? "event" : "events"}`;
  log.scrollTop = log.scrollHeight;
}

function syncSourceToAnimationStep(step, index) {
  state.linkedSource = index > 0 && step.source
    ? { ...step.source, stepLabel: step.label }
    : null;
  state.sourceManualOverride = false;
  if (state.linkedSource) state.activeSourcePath = state.linkedSource.path;

  if (state.sourceFiles.length) {
    renderSourceBrowser({ scrollToHighlight: Boolean(state.linkedSource) });
  } else {
    renderSourceStepContext(null, null);
  }
}

function initSourceBrowser() {
  $("#reload-sources").addEventListener("click", () => loadSources(true));
  loadSources(true);
  window.setInterval(() => loadSources(false), 6000);
}

async function loadSources(forceRender = false) {
  const syncDot = $("#source-sync-dot");
  const syncText = $("#source-sync-text");
  try {
    const response = await fetch("/api/lesson/01/sources", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const files = Array.isArray(payload.files) ? payload.files : [];
    const signature = files.map((file) => `${file.path}:${file.mtimeMs}:${file.size}`).join("|");
    if (forceRender || signature !== state.sourceSignature) {
      state.sourceFiles = files;
      state.sourceSignature = signature;
      if (state.linkedSource && !state.sourceManualOverride) {
        state.activeSourcePath = state.linkedSource.path;
      } else if (!files.some((file) => file.path === state.activeSourcePath)) {
        state.activeSourcePath = files.find((file) => file.exists)?.path || files[0]?.path || null;
      }
      renderSourceBrowser({ scrollToHighlight: Boolean(state.linkedSource && !state.sourceManualOverride) });
    }
    syncDot.classList.remove("is-error");
    const existingCount = files.filter((file) => file.exists).length;
    syncText.textContent = existingCount ? `已联动 ${existingCount} 个文件` : "等待 Java 文件";
  } catch {
    syncDot.classList.add("is-error");
    syncText.textContent = "源码服务未连接";
    if (!state.sourceFiles.length) {
      state.sourceFiles = EXPECTED_SOURCES.map((source) => ({ ...source, exists: false }));
      state.activeSourcePath = state.linkedSource?.path || state.sourceFiles[0].path;
      renderSourceBrowser();
    }
  }
}

function renderSourceBrowser({ scrollToHighlight = false } = {}) {
  const tabs = $("#source-tabs");
  const files = state.sourceFiles.length
    ? state.sourceFiles
    : EXPECTED_SOURCES.map((source) => ({ ...source, exists: false }));
  tabs.replaceChildren();

  files.forEach((file, index) => {
    const button = document.createElement("button");
    const active = file.path === state.activeSourcePath || (!state.activeSourcePath && index === 0);
    button.className = `source-tab${active ? " is-active" : ""}`;
    button.type = "button";
    button.role = "tab";
    button.setAttribute("aria-selected", String(active));
    button.disabled = !file.exists;
    button.title = file.exists ? file.path : `等待生成：${file.path}`;
    const role = document.createElement("span");
    role.textContent = `${file.role} · ${file.exists ? "LIVE" : "PENDING"}`;
    const name = document.createElement("strong");
    name.textContent = file.name || file.path.split("/").pop();
    button.append(role, name);
    button.addEventListener("click", () => {
      state.activeSourcePath = file.path;
      state.sourceManualOverride = true;
      renderSourceBrowser();
    });
    tabs.append(button);
  });

  const activeFile = files.find((file) => file.path === state.activeSourcePath) || files[0];
  if (!activeFile) return;
  const roleElement = $("#active-source-role");
  roleElement.className = `role-badge ${activeFile.role.toLowerCase()}`;
  roleElement.textContent = sourceRoleLabel(activeFile.role);
  $("#active-source-path").textContent = activeFile.path;
  const highlightedLine = activeFile.exists
    && !state.sourceManualOverride
    && state.linkedSource?.path === activeFile.path
    ? findMatchingLine(activeFile.content, state.linkedSource.match)
    : null;
  const content = activeFile.exists
    ? activeFile.content
    : `// 文件尚未生成\n// ${activeFile.path}\n// 保存后，页面将在数秒内自动读取。`;
  renderSourceCode(content, highlightedLine);
  renderSourceStepContext(activeFile, highlightedLine);
  if (scrollToHighlight && highlightedLine) scrollSourceLineIntoView(highlightedLine);
}

function findMatchingLine(content, matchingText) {
  if (!matchingText) return null;
  const lineIndex = String(content)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .findIndex((line) => line.includes(matchingText));
  return lineIndex >= 0 ? lineIndex + 1 : null;
}

function renderSourceCode(content, highlightedLine) {
  const code = $("#source-code code");
  code.replaceChildren();
  String(content).replace(/\r\n?/g, "\n").split("\n").forEach((line, index) => {
    const lineNumber = index + 1;
    const row = document.createElement("span");
    row.className = `source-line${lineNumber === highlightedLine ? " is-highlighted" : ""}`;
    row.dataset.line = String(lineNumber);
    if (lineNumber === highlightedLine) {
      row.id = "current-source-line";
      row.setAttribute("aria-current", "true");
    }

    const number = document.createElement("span");
    number.className = "source-line-number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(lineNumber);
    const text = document.createElement("span");
    text.className = "source-line-text";
    text.textContent = line || " ";
    row.append(number, text);
    code.append(row);
  });
}

function renderSourceStepContext(activeFile, highlightedLine) {
  const context = $("#source-step-context");
  const label = $("#source-step-label");
  const line = $("#source-step-line");
  context.classList.remove("is-linked", "is-manual");

  if (!state.linkedSource) {
    label.textContent = "初始状态无需执行代码";
    line.textContent = "—";
    return;
  }

  const linkedFilename = state.linkedSource.path.split("/").pop();
  const linkedFile = state.sourceFiles.find((file) => file.path === state.linkedSource.path);
  const linkedLine = highlightedLine
    || (linkedFile?.exists ? findMatchingLine(linkedFile.content, state.linkedSource.match) : null);

  if (state.sourceManualOverride && activeFile?.path !== state.linkedSource.path) {
    context.classList.add("is-manual");
    label.textContent = `手动查看 ${activeFile?.name || "其他文件"}；下一步恢复 ${linkedFilename}`;
    line.textContent = linkedLine ? `动画 L${linkedLine}` : "动画行待匹配";
    return;
  }

  context.classList.add("is-linked");
  label.textContent = `${state.linkedSource.stepLabel} · ${state.linkedSource.description}`;
  line.textContent = linkedLine ? `L${linkedLine}` : "匹配中";
}

function scrollSourceLineIntoView(lineNumber) {
  window.requestAnimationFrame(() => {
    const pre = $("#source-code");
    const highlighted = $(`.source-line[data-line="${lineNumber}"]`, pre);
    if (!highlighted) return;
    const centeredTop = highlighted.offsetTop - (pre.clientHeight / 2) + (highlighted.offsetHeight / 2);
    pre.scrollTop = Math.max(0, centeredTop);
  });
}

function sourceRoleLabel(role) {
  return {
    DEMO: "只读 DEMO",
    TASK: "你来写 TASK",
    TEST: "自动验收 TEST",
  }[role] || role;
}

function initNotes() {
  $("#reload-notes").addEventListener("click", () => loadNotes(true));
  $$(".notes-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchNotesDocument(tab.dataset.notesDocument));
  });
  renderNotesDocumentState();
  loadNotes(true);
  window.setInterval(() => loadNotes(false), 5000);
}

function switchNotesDocument(documentKey) {
  if (!NOTES_DOCUMENTS[documentKey] || documentKey === state.activeNotesDocument) return;
  state.activeNotesDocument = documentKey;
  state.notesRequestId += 1;
  renderNotesDocumentState();
  loadNotes(true);
}

function renderNotesDocumentState() {
  const documentKey = state.activeNotesDocument;
  const notesDocument = NOTES_DOCUMENTS[documentKey];
  $$(".notes-tab").forEach((tab) => {
    const active = tab.dataset.notesDocument === documentKey;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $("#notes-title").textContent = notesDocument.title;
  $("#notes-sync-text").textContent = `正在读取 ${notesDocument.filename}`;
  $("#notes-sync-time").textContent = "";

  const cachedMarkdown = state.markdownDocuments[documentKey];
  if (cachedMarkdown) {
    $("#markdown-body").innerHTML = renderMarkdown(cachedMarkdown);
  } else {
    $("#markdown-body").innerHTML = `
      <div class="notes-loading" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>`;
  }
}

async function loadNotes(forceRender = false) {
  const documentKey = state.activeNotesDocument;
  const notesDocument = NOTES_DOCUMENTS[documentKey];
  const requestId = ++state.notesRequestId;
  const dot = $("#notes-sync-dot");
  const status = $("#notes-sync-text");
  try {
    const response = await fetch(notesDocument.url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    const changed = markdown !== state.markdownDocuments[documentKey];
    state.markdownDocuments[documentKey] = markdown;
    if (requestId !== state.notesRequestId || documentKey !== state.activeNotesDocument) return;
    if (forceRender || changed) {
      $("#markdown-body").innerHTML = renderMarkdown(markdown);
    }
    dot.classList.remove("is-error");
    status.textContent = `${notesDocument.title}已实时同步`;
    $("#notes-sync-time").textContent = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  } catch {
    if (requestId !== state.notesRequestId || documentKey !== state.activeNotesDocument) return;
    dot.classList.add("is-error");
    status.textContent = `等待 ${notesDocument.filename}`;
    $("#notes-sync-time").textContent = "自动重试中";
    if (!state.markdownDocuments[documentKey]) {
      $("#markdown-body").innerHTML = `
        <div class="notes-empty">
          <strong>${notesDocument.title}尚未生成</strong>
          页面会持续读取 <code>docs/v3/lessons/${notesDocument.filename}</code>，文件保存后无需刷新浏览器。
        </div>`;
    }
  }
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let listType = null;
  const headingIds = new Map();

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };
  const openList = (type) => {
    if (listType === type) return;
    closeList();
    output.push(`<${type}>`);
    listType = type;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    const fence = trimmed.match(/^```\s*([^\s`]*)/);
    if (fence) {
      flushParagraph();
      closeList();
      const language = fence[1] || "code";
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      output.push(
        `<pre data-language="${escapeHtml(language)}"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    if (looksLikeTableRow(line) && isTableDivider(lines[index + 1] || "")) {
      flushParagraph();
      closeList();
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && looksLikeTableRow(lines[index]) && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      index -= 1;
      output.push('<div class="markdown-table-scroll" tabindex="0" role="region" aria-label="可横向滚动的数据表"><table><thead><tr>');
      headers.forEach((cell) => output.push(`<th>${renderInline(cell)}</th>`));
      output.push("</tr></thead><tbody>");
      rows.forEach((row) => {
        output.push("<tr>");
        headers.forEach((_, cellIndex) => output.push(`<td>${renderInline(row[cellIndex] || "")}</td>`));
        output.push("</tr>");
      });
      output.push("</tbody></table></div>");
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      const baseId = slugify(heading[2]) || `section-${index}`;
      const seen = headingIds.get(baseId) || 0;
      headingIds.set(baseId, seen + 1);
      const id = seen ? `${baseId}-${seen + 1}` : baseId;
      output.push(`<h${level} id="${id}">${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^([-*_])(?:\s*\1){2,}$/.test(trimmed)) {
      flushParagraph();
      closeList();
      output.push("<hr>");
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      closeList();
      const quoteLines = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      index -= 1;
      output.push(`<blockquote><p>${renderInline(quoteLines.join(" "))}</p></blockquote>`);
      continue;
    }

    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const type = ordered ? "ol" : "ul";
      openList(type);
      let content = (unordered || ordered)[1];
      while (index + 1 < lines.length) {
        const continuationLine = lines[index + 1];
        const continuation = continuationLine.trim();
        const startsAnotherBlock = !continuation
          || /^#{1,6}\s+/.test(continuationLine)
          || /^```/.test(continuation)
          || /^>/.test(continuation)
          || /^\s*[-+*]\s+/.test(continuationLine)
          || /^\s*\d+[.)]\s+/.test(continuationLine)
          || looksLikeTableRow(continuationLine);
        if (startsAnotherBlock) break;
        content += ` ${continuation}`;
        index += 1;
      }
      const checkbox = content.match(/^\[([ xX])\]\s+(.+)$/);
      output.push(
        checkbox
          ? `<li><input type="checkbox" disabled${checkbox[1].toLowerCase() === "x" ? " checked" : ""}> ${renderInline(checkbox[2])}</li>`
          : `<li>${renderInline(content)}</li>`,
      );
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();
  return output.join("\n");
}

function renderInline(text) {
  const tokens = [];
  const putToken = (html) => {
    const token = `@@JUC_TOKEN_${tokens.length}@@`;
    tokens.push(html);
    return token;
  };

  let working = String(text)
    .replace(/`([^`]+)`/g, (_, code) => putToken(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]]+)]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, (_, label, rawUrl) => {
      const url = safeLink(rawUrl);
      if (!url) return escapeHtml(label);
      const external = /^https?:\/\//i.test(url);
      return putToken(
        `<a href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noreferrer noopener"' : ""}>${escapeHtml(label)}</a>`,
      );
    });

  working = escapeHtml(working)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  tokens.forEach((token, index) => {
    working = working.replace(`@@JUC_TOKEN_${index}@@`, token);
  });
  return working;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function safeLink(url) {
  const value = String(url).trim();
  if (/^(https?:\/\/|\/|\.\.?\/|#)/i.test(value)) return value;
  return "";
}

function looksLikeTableRow(line) {
  const trimmed = line.trim();
  return trimmed.includes("|") && !trimmed.startsWith("```");
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function slugify(text) {
  return String(text)
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function initCopyButtons() {
  $$(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const content = button.dataset.copy || "";
      try {
        await navigator.clipboard.writeText(content);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      showToast("命令已复制");
    });
  });
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTodos();
  initLab();
  initSourceBrowser();
  initNotes();
  initCopyButtons();
});
