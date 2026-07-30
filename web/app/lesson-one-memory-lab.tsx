"use client";

import { useEffect, useState } from "react";

type RouteName = "none" | "heap-a" | "heap-b" | "a-heap" | "b-heap";

type MemoryStep = {
  short: string;
  actor: string;
  action: string;
  explanation: string;
  operation: string;
  change: string;
  heapValue: number;
  aOld: string;
  aNext: string;
  bOld: string;
  bNext: string;
  route: RouteName;
  token?: string;
  active: "class" | "heap" | "a" | "b";
  writes: number;
  overwrite?: boolean;
};

const MEMORY_STEPS: MemoryStep[] = [
  {
    short: "创建对象",
    actor: "主线程",
    action: "创建一个 UnsafeCounter 对象，两个工作线程都拿到同一个引用",
    explanation:
      "UnsafeCounter 的类元数据只描述字段和方法。真正会变化的 value 存在堆里的 UnsafeCounter @C1 对象中。",
    operation: "UnsafeCounter counter = new UnsafeCounter();",
    change: "堆：创建 UnsafeCounter @C1，value 初始化为 0",
    heapValue: 0,
    aOld: "—",
    aNext: "—",
    bOld: "—",
    bNext: "—",
    route: "none",
    active: "class",
    writes: 0,
  },
  {
    short: "A 读取",
    actor: "线程 A",
    action: "从堆对象读取 value=0",
    explanation:
      "线程 A 的 increment() 栈帧暂时保存旧值 0。此时堆里的 value 还没有变化。",
    operation: "getfield UnsafeCounter.value  // 读到 0",
    change: "线程 A 操作数栈：旧值 — → 0",
    heapValue: 0,
    aOld: "0",
    aNext: "—",
    bOld: "—",
    bNext: "—",
    route: "heap-a",
    token: "0",
    active: "a",
    writes: 0,
  },
  {
    short: "B 读取",
    actor: "线程 B",
    action: "也从同一个堆对象读取 value=0",
    explanation:
      "线程 A 还没写回，所以线程 B 也拿到了旧值 0。两个线程现在各自保存一份 0。",
    operation: "getfield UnsafeCounter.value  // 也读到 0",
    change: "线程 B 操作数栈：旧值 — → 0",
    heapValue: 0,
    aOld: "0",
    aNext: "—",
    bOld: "0",
    bNext: "—",
    route: "heap-b",
    token: "0",
    active: "b",
    writes: 0,
  },
  {
    short: "A 计算",
    actor: "线程 A",
    action: "在线程自己的栈帧中计算 0+1",
    explanation:
      "计算得到的新值 1 仍然只在线程 A 的临时执行状态中，还没有写进 UnsafeCounter 对象。",
    operation: "iadd  // 0 + 1 = 1",
    change: "线程 A 操作数栈：新值 — → 1",
    heapValue: 0,
    aOld: "0",
    aNext: "1",
    bOld: "0",
    bNext: "—",
    route: "none",
    active: "a",
    writes: 0,
  },
  {
    short: "B 计算",
    actor: "线程 B",
    action: "线程 B 也用自己的旧值 0 计算出 1",
    explanation:
      "两个线程互不共享栈帧，因此它们都不知道对方也准备写入 1。",
    operation: "iadd  // 0 + 1 = 1",
    change: "线程 B 操作数栈：新值 — → 1",
    heapValue: 0,
    aOld: "0",
    aNext: "1",
    bOld: "0",
    bNext: "1",
    route: "none",
    active: "b",
    writes: 0,
  },
  {
    short: "A 写回",
    actor: "线程 A",
    action: "把计算结果 1 写回堆对象的 value",
    explanation:
      "第一次加一已经写入共享对象。此刻 value=1，但线程 B 手里仍然拿着之前算好的 1。",
    operation: "putfield UnsafeCounter.value  // 0 → 1",
    change: "堆 UnsafeCounter @C1：value 0 → 1",
    heapValue: 1,
    aOld: "0",
    aNext: "1",
    bOld: "0",
    bNext: "1",
    route: "a-heap",
    token: "1",
    active: "heap",
    writes: 1,
  },
  {
    short: "B 覆盖",
    actor: "线程 B",
    action: "线程 B 再把自己的结果 1 写回同一个 value",
    explanation:
      "第二次写入的仍然是 1，它覆盖了第一次写入的 1。调用了两次 increment()，结果却只增加一次。",
    operation: "putfield UnsafeCounter.value  // 1 → 1，丢失一次更新",
    change: "堆 UnsafeCounter @C1：value 1 → 1（第二次更新没有留下来）",
    heapValue: 1,
    aOld: "0",
    aNext: "1",
    bOld: "0",
    bNext: "1",
    route: "b-heap",
    token: "1",
    active: "heap",
    writes: 2,
    overwrite: true,
  },
];

function fieldClass(active: boolean) {
  return active ? "runtime-field is-changing" : "runtime-field";
}

export default function LessonOneMemoryLab() {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = MEMORY_STEPS[stepIndex];

  useEffect(() => {
    if (!playing) {
      return;
    }
    if (stepIndex >= MEMORY_STEPS.length - 1) {
      return;
    }
    const nextStep = stepIndex + 1;
    const timer = window.setTimeout(() => {
      setStepIndex(nextStep);
      if (nextStep === MEMORY_STEPS.length - 1) {
        setPlaying(false);
      }
    }, 1450);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex]);

  function selectStep(index: number) {
    setPlaying(false);
    setStepIndex(index);
  }

  function togglePlay() {
    if (stepIndex === MEMORY_STEPS.length - 1) {
      setStepIndex(0);
    }
    setPlaying((current) => !current);
  }

  return (
    <div className="runtime-lab">
      <div className="runtime-toolbar">
        <div>
          <span>丢失更新的一种真实交错 · STEP {stepIndex + 1}/7</span>
          <strong>{step.short}</strong>
        </div>
        <div className="runtime-metrics" aria-label="计数器当前状态">
          <span>
            正确结果 <b>2</b>
          </span>
          <span>
            当前 value <b>{step.heapValue}</b>
          </span>
          <span className={step.overwrite ? "has-loss" : ""}>
            丢失更新 <b>{step.overwrite ? 1 : 0}</b>
          </span>
        </div>
        <div className="runtime-controls" aria-label="内存动画控制">
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
            {playing ? "暂停" : stepIndex === MEMORY_STEPS.length - 1 ? "重播" : "播放"}
          </button>
          <button
            type="button"
            disabled={stepIndex === MEMORY_STEPS.length - 1}
            onClick={() =>
              selectStep(Math.min(MEMORY_STEPS.length - 1, stepIndex + 1))
            }
          >
            下一步
          </button>
        </div>
      </div>

      <div className="runtime-map-scroll">
        <div
          className="runtime-map"
          role="img"
          aria-label={`JVM 内存更新图。当前步骤：${step.action}。堆中 UnsafeCounter.value=${step.heapValue}。`}
        >
          <header className="runtime-map-header">
            <strong>JVM 进程内存（教学简化）</strong>
            <span>实线框是具体结构 · 虚线框是内存区域 · 活动圆点是正在移动的数据</span>
          </header>

          <section
            className={`runtime-zone class-zone ${
              step.active === "class" ? "is-active" : ""
            }`}
          >
            <header>
              <strong>类元数据区 / Metaspace</strong>
              <span>所有线程共享 · 保存类的结构，不保存某个对象的当前值</span>
            </header>
            <div className="class-definition">
              <strong>UnsafeCounter 类元数据</strong>
              <code>字段说明：int value</code>
              <code>方法代码：getfield → iadd → putfield</code>
              <small>它像设计图；真正的 value=0/1 在下面的堆对象中。</small>
            </div>
          </section>

          <div className="runtime-core">
            <section
              className={`runtime-zone thread-zone thread-a ${
                step.active === "a" ? "is-active" : ""
              }`}
            >
              <header>
                <strong>线程 A 的栈</strong>
                <span>只归线程 A</span>
              </header>
              <div className="stack-frame">
                <strong>increment() 栈帧</strong>
                <div className="runtime-field">
                  <span>局部变量表</span>
                  <code>this → UnsafeCounter @C1</code>
                </div>
                <div
                  className={fieldClass(
                    step.active === "a" && step.aOld !== "—",
                  )}
                >
                  <span>操作数栈 · 读到的旧值</span>
                  <code>{step.aOld}</code>
                </div>
                <div
                  className={fieldClass(
                    step.active === "a" && step.aNext !== "—",
                  )}
                >
                  <span>操作数栈 · 计算后的新值</span>
                  <code>{step.aNext}</code>
                </div>
              </div>
            </section>

            <div className="route-lane route-a" aria-hidden="true">
              <div
                className={`route-track direction-left ${
                  step.route === "heap-a" ? "is-active" : ""
                }`}
              >
                <span>读取 value</span>
                {step.route === "heap-a" ? (
                  <i className="data-packet" key={`heap-a-${stepIndex}`}>
                    {step.token}
                  </i>
                ) : null}
              </div>
              <div
                className={`route-track direction-right ${
                  step.route === "a-heap" ? "is-active" : ""
                }`}
              >
                <span>写回 value</span>
                {step.route === "a-heap" ? (
                  <i className="data-packet" key={`a-heap-${stepIndex}`}>
                    {step.token}
                  </i>
                ) : null}
              </div>
            </div>

            <section
              className={`runtime-zone heap-zone ${
                step.active === "heap" ? "is-active" : ""
              } ${step.overwrite ? "has-overwrite" : ""}`}
            >
              <header>
                <strong>堆 / Heap</strong>
                <span>所有线程共享</span>
              </header>
              <div className="heap-object">
                <div className="object-header">
                  <strong>UnsafeCounter @C1</strong>
                  <span>new UnsafeCounter()</span>
                </div>
                <div
                  className={`object-field ${
                    step.active === "heap" ? "is-changing" : ""
                  }`}
                  key={`heap-value-${stepIndex}`}
                >
                  <span>int value</span>
                  <strong>{step.heapValue}</strong>
                </div>
                <small>两个线程的 this 都指向这个对象。</small>
              </div>
              {step.overwrite ? (
                <div className="overwrite-note">
                  第二次仍写入 1，第一次更新被覆盖
                </div>
              ) : (
                <div className="write-count">
                  已完成写回：{step.writes}/2
                </div>
              )}
            </section>

            <div className="route-lane route-b" aria-hidden="true">
              <div
                className={`route-track direction-right ${
                  step.route === "heap-b" ? "is-active" : ""
                }`}
              >
                <span>读取 value</span>
                {step.route === "heap-b" ? (
                  <i className="data-packet" key={`heap-b-${stepIndex}`}>
                    {step.token}
                  </i>
                ) : null}
              </div>
              <div
                className={`route-track direction-left ${
                  step.route === "b-heap" ? "is-active" : ""
                }`}
              >
                <span>写回 value</span>
                {step.route === "b-heap" ? (
                  <i className="data-packet" key={`b-heap-${stepIndex}`}>
                    {step.token}
                  </i>
                ) : null}
              </div>
            </div>

            <section
              className={`runtime-zone thread-zone thread-b ${
                step.active === "b" ? "is-active" : ""
              }`}
            >
              <header>
                <strong>线程 B 的栈</strong>
                <span>只归线程 B</span>
              </header>
              <div className="stack-frame">
                <strong>increment() 栈帧</strong>
                <div className="runtime-field">
                  <span>局部变量表</span>
                  <code>this → UnsafeCounter @C1</code>
                </div>
                <div
                  className={fieldClass(
                    step.active === "b" && step.bOld !== "—",
                  )}
                >
                  <span>操作数栈 · 读到的旧值</span>
                  <code>{step.bOld}</code>
                </div>
                <div
                  className={fieldClass(
                    step.active === "b" && step.bNext !== "—",
                  )}
                >
                  <span>操作数栈 · 计算后的新值</span>
                  <code>{step.bNext}</code>
                </div>
              </div>
            </section>
          </div>

          <footer className="runtime-map-footnote">
            图中“旧值/新值”是对 JVM 操作数栈中间值的易读命名，不是源码里额外声明的变量。
          </footer>
        </div>
      </div>

      <div className="runtime-timeline" aria-label="七步执行顺序">
        {MEMORY_STEPS.map((item, index) => (
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
