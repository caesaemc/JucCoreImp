import type { LessonDetail } from "./course-data";
import type { SourceSnippet } from "./source-snippets.generated";

export const lessonOneDetail: LessonDetail = {
  number: "01",
  stage: 1,
  title: "并发问题与 Java 内存模型",
  shortTitle: "先看懂共享数据",
  english: "SHARED DATA / JMM",
  hook: "两个线程都执行一次加一，结果为什么可能只加了一次？",
  lead:
    "第一课只做一件事：看清共享数据放在哪里、两个线程怎样读写它，以及代码靠什么保证结果正确。",
  outcome: "看到共享字段时，能先判断原子性、可见性和先后关系。",
  accent: "cyan",
  concepts: [
    {
      code: "A",
      title: "原子性",
      subtitle: "一次做完",
      body: "一个操作要么完整完成，要么还没开始，中间不能被另一个线程插进来。",
      boundary: "`value++` 是读取、加一、写回三步，不是一次做完。",
    },
    {
      code: "V",
      title: "可见性",
      subtitle: "别人能看到",
      body: "线程 A 改了共享数据，线程 B 需要有明确的同步保证才能可靠看到新值。",
      boundary: "运行很多次都碰巧看到新值，也不能证明代码安全。",
    },
    {
      code: "O",
      title: "先后关系",
      subtitle: "谁先谁后有保证",
      body: "happens-before 用来证明前面的写入对后面的读取可见。",
      boundary: "`sleep()` 只是等待时间，不会自动建立内存保证。",
    },
  ],
  flowTitle: "一次丢失更新",
  flowLead: "两个线程都先拿到旧值 0，随后都把 1 写回同一个字段。",
  flow: [
    {
      label: "共享值",
      actor: "堆中 Counter 对象",
      action: "value = 0",
      before: "没有线程读取",
      after: "两个线程准备读取",
      detail: "value 是两个线程共同访问的数据。",
      signal: "SHARED",
    },
    {
      label: "两次读取",
      actor: "线程 A / 线程 B",
      action: "snapshot = value",
      before: "value = 0",
      after: "两个 snapshot 都是 0",
      detail: "每个线程把旧值复制到自己的局部变量。",
      signal: "READ",
    },
    {
      label: "两次写回",
      actor: "线程 A / 线程 B",
      action: "value = snapshot + 1",
      before: "两个 snapshot 都是 0",
      after: "两次都写入 1",
      detail: "第二次写入覆盖第一次写入，没有得到 2。",
      signal: "OVERWRITE",
    },
  ],
  zones: [
    {
      code: "A",
      name: "snapshot",
      kind: "线程 A 的局部变量",
      owner: "线程 A",
      value: "0",
      mutation: "从共享 value 复制",
      rule: "其他线程不能直接访问。",
    },
    {
      code: "C",
      name: "UnsafeCounter.value",
      kind: "堆中的对象字段",
      owner: "两个线程共享",
      value: "0 → 1",
      mutation: "两个线程都写",
      rule: "复合更新必须受到保护。",
    },
    {
      code: "B",
      name: "snapshot",
      kind: "线程 B 的局部变量",
      owner: "线程 B",
      value: "0",
      mutation: "从共享 value 复制",
      rule: "与线程 A 的 snapshot 不是同一个变量。",
    },
    {
      code: "R",
      name: "result",
      kind: "主线程读取的结果",
      owner: "主线程",
      value: "期望 2 / 实际 1",
      mutation: "join 后读取",
      rule: "join 保证看见线程结束前的写入。",
    },
  ],
  routes: [
    {
      data: "value=0",
      from: "UnsafeCounter.value",
      via: "普通字段读取",
      to: "线程 A snapshot",
      guarantee: "线程 A 拿到旧值 0",
    },
    {
      data: "value=0",
      from: "UnsafeCounter.value",
      via: "普通字段读取",
      to: "线程 B snapshot",
      guarantee: "线程 B 也拿到旧值 0",
    },
    {
      data: "snapshot+1",
      from: "线程 A snapshot",
      via: "普通字段写入",
      to: "UnsafeCounter.value",
      guarantee: "第一次写入 1",
    },
    {
      data: "snapshot+1",
      from: "线程 B snapshot",
      via: "普通字段写入",
      to: "UnsafeCounter.value",
      guarantee: "再次写入 1，覆盖前一次结果",
    },
  ],
  sourceKeys: ["01-counter", "01-lost-update", "01-happens-before"],
  exercise: {
    title: "修复线程安全计数器",
    summary: "不使用原子类，让多个线程执行加一时不丢数据。",
    requirements: [
      "increment() 的读取、加一、写回不能被其他线程插入",
      "value() 必须能看到已经完成的更新",
      "说明代码使用了哪一把锁",
    ],
    testCommand: "mvn -q -Dtest=ExerciseCounterTest test",
    expected: "所有更新都被保留，最终值等于期望值。",
  },
  runClass: "com.caesaemc.juc.lesson01.Lesson01Application",
  interview: [
    {
      tag: "高频",
      question: "为什么 i++ 不是线程安全的？",
      answer: "因为它包含读取、计算和写回。两个线程可能读到同一个旧值，再写回同一个新值。",
    },
    {
      tag: "基础",
      question: "没有 happens-before 就一定读到旧值吗？",
      answer: "不一定，但代码没有可靠保证。碰巧读到新值不能证明它线程安全。",
    },
    {
      tag: "误区",
      question: "Thread.sleep 能解决可见性问题吗？",
      answer: "不能。sleep 只影响调度，不提供内存同步保证。",
    },
  ],
  finish: "看到共享字段时，先问谁读、谁写、是不是复合操作、靠什么保证可见。",
};

export const lessonOneSources: SourceSnippet[] = [
  {
    key: "01-counter",
    tab: "共享计数器",
    filename: "UnsafeCounter.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/UnsafeCounter.java",
    startLine: 10,
    endLine: 20,
    highlights: [10, 14, 19],
    note: "value 放在 Counter 对象里，两个线程共享；value++ 实际上是三步。",
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/UnsafeCounter.java#L10-L20",
    code: `    private int value;

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
    key: "01-lost-update",
    tab: "丢失更新",
    filename: "DeterministicLostUpdateDemo.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java",
    startLine: 18,
    endLine: 30,
    highlights: [20, 21, 24, 25],
    note: "两个线程都先读完，再同时写回，所以能稳定看到“期望 2、实际 1”。",
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/DeterministicLostUpdateDemo.java#L18-L30",
    code: `        Runnable increment = () -> {
            int snapshot = state.value;
            bothThreadsRead.countDown();
            try {
                allowWriteBack.await();
                state.value = snapshot + 1;
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        };`,
  },
  {
    key: "01-happens-before",
    tab: "start / join",
    filename: "HappensBeforeDemo.java",
    path: "src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java",
    startLine: 17,
    endLine: 29,
    highlights: [17, 21, 22, 25, 26, 29],
    note: "start 负责把 input 交给工作线程，join 负责把 output 带回主线程。",
    link: "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson01/HappensBeforeDemo.java#L17-L29",
    code: `        state.input = 42;

        Thread worker = new Thread(() -> {
            state.observedByWorker = state.input;
            state.output = state.input * 2;
        });

        worker.start();
        worker.join();
        return new HappensBeforeResult(state.observedByWorker, state.output);`,
  },
];
