import {
  getLessonDetail,
  getLessonSources,
  type Concept,
  type CourseTab,
  type DataRoute,
  type DataZone,
  type InterviewQuestion,
  type LessonDetail,
} from "./course-data";
import {
  lessonOneDetail,
  lessonOneSources,
} from "./lesson-one-simple-data";
import type { SourceSnippet } from "./source-snippets.generated";

export type FastLesson = LessonDetail & {
  duration: string;
  originLessons: string;
  quickRules: string[];
};

export const fastCourseTabs: CourseTab[] = [
  {
    number: "01",
    stage: 1,
    shortTitle: "JMM",
    title: "共享数据与 Java 内存模型",
  },
  {
    number: "02",
    stage: 1,
    shortTitle: "发布与锁",
    title: "volatile、synchronized 与安全发布",
  },
  {
    number: "03",
    stage: 1,
    shortTitle: "线程与锁",
    title: "线程协作、CAS、锁与同步器",
  },
  {
    number: "04",
    stage: 2,
    shortTitle: "集合与队列",
    title: "并发集合、队列与生产消费",
  },
  {
    number: "05",
    stage: 2,
    shortTitle: "任务执行",
    title: "线程池、异步任务与虚拟线程",
  },
  {
    number: "06",
    stage: 2,
    shortTitle: "实战",
    title: "可靠性、排障与综合项目",
  },
];

function legacy(number: string): LessonDetail {
  const detail = getLessonDetail(number);
  if (!detail) {
    throw new Error(`找不到原课程 ${number}`);
  }
  return detail;
}

function concept(
  code: string,
  title: string,
  body: string,
  boundary: string,
): Concept {
  return {
    code,
    title,
    subtitle: "",
    body,
    boundary,
  };
}

function zone(
  code: string,
  name: string,
  kind: string,
  owner: string,
  value: string,
  rule: string,
): DataZone {
  return {
    code,
    name,
    kind,
    owner,
    value,
    mutation: "",
    rule,
  };
}

function route(
  data: string,
  from: string,
  via: string,
  to: string,
  guarantee: string,
): DataRoute {
  return { data, from, via, to, guarantee };
}

function question(
  tag: string,
  prompt: string,
  answer: string,
): InterviewQuestion {
  return { tag, question: prompt, answer };
}

const lesson01: FastLesson = {
  ...lessonOneDetail,
  title: "共享数据与 Java 内存模型",
  shortTitle: "先看懂共享数据",
  duration: "60 分钟",
  originLessons: "原第 01 课",
  quickRules: [
    "先找共享数据：谁读、谁写。",
    "再拆操作：一行代码不一定只做一步。",
    "最后找保证：没有明确同步，就不要靠运气。",
  ],
  zones: [
    zone("H", "Counter 对象", "堆内存 / 两线程共享", "线程 A、B", "value = 0", "共享值放在对象字段里。"),
    zone("A", "线程 A", "线程栈 / 只归 A", "线程 A", "snapshot = 0", "A 把旧值复制到自己的局部变量。"),
    zone("B", "线程 B", "线程栈 / 只归 B", "线程 B", "snapshot = 0", "B 也读到了同一个旧值。"),
    zone("R", "Counter 对象", "堆内存 / 两线程共享", "线程 A、B", "value = 1", "两次都写 1，所以少了一次更新。"),
  ],
  routes: [
    route("旧值 0", "Counter.value", "普通读取", "线程 A snapshot", "A 拿到 0"),
    route("旧值 0", "Counter.value", "普通读取", "线程 B snapshot", "B 也拿到 0"),
    route("新值 1", "A、B 的 snapshot", "两次普通写入", "Counter.value", "后一次覆盖前一次"),
  ],
};

const base02 = legacy("02");
const lesson02: FastLesson = {
  ...base02,
  title: "volatile、synchronized 与安全发布",
  shortTitle: "发布与锁",
  hook: "一个线程改了数据，怎样让另一个线程正确地看到？",
  lead:
    "这一课只分清三件事：看见新值、一次只让一个线程修改、把完整对象交给其他线程。",
  outcome: "能在 volatile、synchronized 和不可变对象之间做出简单、正确的选择。",
  duration: "75 分钟",
  originLessons: "原第 02 课",
  quickRules: [
    "只替换一个开关或对象引用：先考虑 volatile。",
    "读取、判断、修改必须一起完成：用 synchronized 或锁。",
    "多个字段要保持同一版本：先造好不可变对象，再一次替换引用。",
  ],
  concepts: [
    concept(
      "V",
      "volatile：让别人看到",
      "写线程改完 volatile 字段后，读线程能可靠看到新值。",
      "它不会把 value++ 变成一次完成。",
    ),
    concept(
      "S",
      "synchronized：一次进一个",
      "同一把锁里的代码，同一时间只让一个线程执行。",
      "读和写必须使用同一把锁。",
    ),
    concept(
      "P",
      "安全发布：先造完，再共享",
      "先把对象完整构造好，再通过 volatile 引用交给读线程。",
      "不要在构造过程中把 this 交出去。",
    ),
  ],
  zones: [
    zone("W", "writer 局部变量", "线程栈 / 只归 writer", "config-writer", "candidate = Settings v1", "先在自己的线程里造完整。"),
    zone("S", "Settings 对象", "堆内存 / 不再修改", "所有读线程", "version、timeout、retries", "字段已经组成同一个版本。"),
    zone("R", "ConfigRepository 对象", "堆内存 / 共享入口", "writer 与 reader", "volatile current → v1", "只替换一次对象引用。"),
    zone("D", "reader 局部变量", "线程栈 / 只归 reader", "config-reader", "snapshot → v1", "一次读取后一直使用同一个版本。"),
  ],
  routes: [
    route("完整配置字段", "writer 局部变量", "new Settings(...)", "Settings 对象", "对象先造完整"),
    route("Settings v1 引用", "Settings 对象", "volatile 写 current", "ConfigRepository.current", "完整对象被发布"),
    route("Settings v1 引用", "ConfigRepository.current", "volatile 读", "reader snapshot", "reader 看到同一版本"),
  ],
  interview: [
    question(
      "高频",
      "volatile 能保证 value++ 线程安全吗？",
      "不能。value++ 仍是读取、加一、写回，多线程会互相覆盖。",
    ),
    question(
      "选型",
      "volatile 和 synchronized 怎么选？",
      "只发布一个独立值可用 volatile；多个步骤必须一起完成时用 synchronized 或锁。",
    ),
    question(
      "发布",
      "什么是安全发布？",
      "其他线程不只看到引用，还能看到对象已经构造完成的正确状态。",
    ),
  ],
  finish: "看到共享字段时，能先说清它需要“看见”、需要“独占”，还是需要“完整对象”。",
};

const base03 = legacy("03");
const lesson03: FastLesson = {
  ...base03,
  number: "03",
  stage: 1,
  title: "线程协作、CAS、锁与同步器",
  shortTitle: "线程与锁",
  hook: "线程怎么停、怎么抢一个值、抢不到时去哪里等？",
  lead: "把中断、CAS、Lock、Condition、AQS 和常用同步器放在一条线程协作线上学习。",
  outcome: "能根据“等待条件、竞争强度、资源数量”选择协作工具。",
  duration: "2 × 75 分钟",
  originLessons: "合并原第 03～06 课",
  quickRules: [
    "停止线程：发 interrupt，请线程自己收尾。",
    "一个值的短更新：先看原子类；竞争高时注意重试成本。",
    "需要等待条件或维护多个状态：用 Lock/Condition；限制资源数用 Semaphore。",
  ],
  concepts: [
    concept("I", "中断：停止请求", "interrupt 是通知，不是强制杀死线程。", "捕获 InterruptedException 后不要悄悄吞掉。"),
    concept("C", "CAS：比较成功才写", "值没被别人改过就更新，否则重新读取再试。", "复杂规则或高竞争时，重试可能很贵。"),
    concept("L", "锁与等待队列", "拿不到锁或条件不满足的线程进入队列等待。", "Condition 必须和创建它的 Lock 配套使用。"),
  ],
  zones: [
    zone("T", "任务线程", "线程栈", "worker", "运行 / 响应中断", "在安全位置检查停止请求。"),
    zone("A", "共享原子状态", "堆内存", "多个线程", "old → new", "CAS 成功的线程完成这次更新。"),
    zone("Q", "AQS 等待队列", "堆内存", "Lock / 同步器", "等待节点", "抢不到的线程在这里排队。"),
    zone("R", "受保护资源", "堆内存", "持锁线程", "一致状态", "拿到锁或许可后才能访问。"),
  ],
  routes: [
    route("停止请求", "调用线程", "interrupt", "任务线程", "任务在安全点退出"),
    route("新状态", "任务线程", "CAS / Lock", "共享状态", "一次更新成功"),
    route("等待线程", "竞争现场", "AQS 队列", "受保护资源", "被唤醒后重新竞争"),
  ],
  sourceKeys: ["03-termination", "04-cas", "05-mutex", "06-semaphore"],
  interview: [
    question("中断", "interrupt 为什么不是 kill？", "它只发出停止请求，任务要主动检查、清理并退出。"),
    question("CAS", "CAS 失败后为什么要重试？", "说明旧值已变化，必须重新读取并计算新值。"),
    question("AQS", "AQS 主要帮我们做什么？", "它管理同步状态、等待队列、阻塞和唤醒；子类定义成功条件。"),
  ],
};

const base04 = legacy("07");
const lesson04: FastLesson = {
  ...base04,
  number: "04",
  stage: 2,
  title: "并发集合、队列与生产消费",
  shortTitle: "集合与队列",
  hook: "容器里的单次操作安全，不代表两次操作合起来也安全。",
  lead: "把 ConcurrentHashMap 的复合操作和 BlockingQueue 的背压放在一课里。",
  outcome: "能写出不会重复加载、不会无限堆积的并发数据通道。",
  duration: "90 分钟",
  originLessons: "合并原第 07～08 课",
  quickRules: [
    "不要把 containsKey 和 put 拼成一个并发操作。",
    "同 key 建立值优先用 computeIfAbsent 等容器原子方法。",
    "生产速度可能大于消费速度时，队列必须有容量上限。",
  ],
  concepts: [
    concept("M", "并发 Map", "单次 get/put 安全，复合动作要用容器提供的原子方法。", "映射函数不要做很慢或递归的工作。"),
    concept("Q", "阻塞队列", "队列满时让生产者等待，把压力传回上游。", "无界队列会把过载变成内存和延迟问题。"),
    concept("E", "结束信号", "生产结束时，要明确告诉消费者退出。", "不要让消费者永远卡在 take。"),
  ],
  zones: [
    zone("P", "生产者", "线程栈", "producer", "item", "生成一条数据。"),
    zone("C", "并发容器", "堆内存 / 共享", "多个线程", "key → value", "原子建立或更新映射。"),
    zone("Q", "有界队列", "堆内存 / 共享", "生产者与消费者", "最多 N 条", "满了就阻塞或拒绝。"),
    zone("R", "消费者", "线程栈", "consumer", "batch / result", "取走数据并处理。"),
  ],
  routes: [
    route("key/value", "生产者", "computeIfAbsent", "并发容器", "同 key 不重复建立"),
    route("item", "并发容器", "queue.put", "有界队列", "容量形成背压"),
    route("item / batch", "有界队列", "take / drainTo", "消费者", "阻塞等待且能批量处理"),
  ],
  sourceKeys: ["07-compound", "07-cache", "08-pipeline", "08-handoff"],
  interview: [
    question("Map", "ConcurrentHashMap 的 put 安全，为什么 containsKey+put 不安全？", "两次调用之间会被其他线程插入，整体不是一个动作。"),
    question("队列", "为什么生产环境更偏向有界队列？", "它能给出明确的满载信号，避免任务无限堆积。"),
    question("选型", "ArrayBlockingQueue 和 SynchronousQueue 最大区别？", "前者保存有限元素，后者容量为零，生产和消费必须直接配对。"),
  ],
};

const base05 = legacy("09");
const lesson05: FastLesson = {
  ...base05,
  number: "05",
  stage: 2,
  title: "线程池、异步任务与虚拟线程",
  shortTitle: "任务执行",
  hook: "任务提交以后，是立刻执行、排队、加线程，还是被拒绝？",
  lead: "把线程池、Future、CompletableFuture、ForkJoin 和虚拟线程放进同一张任务执行地图。",
  outcome: "能为 CPU 计算、阻塞 I/O 和异步编排选择合适的执行方式。",
  duration: "2 × 90 分钟",
  originLessons: "合并原第 09～13 课",
  quickRules: [
    "线程池先看：核心线程、队列、最大线程、拒绝策略。",
    "多个独立 I/O 可并发发起，但要共享一个总超时。",
    "虚拟线程降低线程成本，不会自动增加数据库或下游容量。",
  ],
  concepts: [
    concept("P", "线程池", "用有限工作线程、有限队列和拒绝策略控制任务。", "无界队列会让 maxPoolSize 很难生效。"),
    concept("F", "Future 编排", "Future 表示将来的结果；CompletableFuture 用来组合多个结果。", "每个任务单独完整等待会累加超时。"),
    concept("V", "虚拟线程", "适合大量阻塞 I/O，让代码保持一请求一线程的直线写法。", "外部资源仍要限流，并关注 pinning。"),
  ],
  zones: [
    zone("I", "提交线程", "线程栈", "request", "Task", "把任务交给执行器。"),
    zone("E", "执行器", "堆内存 / 共享", "线程池或虚拟线程调度器", "workers + queue", "决定执行、排队或拒绝。"),
    zone("F", "Future 图", "堆内存 / 共享", "编排线程", "结果 / 异常 / 超时", "把多个任务结果组合起来。"),
    zone("O", "调用结果", "请求上下文", "调用方", "完整或部分结果", "在总截止时间内返回。"),
  ],
  routes: [
    route("Task", "提交线程", "execute / submit", "执行器", "任务受容量控制"),
    route("结果或异常", "执行器", "Future / CompletableFuture", "Future 图", "状态可组合"),
    route("最终结果", "Future 图", "总 deadline", "调用方", "等待时间不无限累加"),
  ],
  sourceKeys: ["09-decision", "10-deadline", "11-aggregate", "13-virtual"],
  interview: [
    question("线程池", "ThreadPoolExecutor 提交任务的顺序？", "先核心线程，再入队，再尝试非核心线程，最后拒绝。"),
    question("超时", "多个 Future 为什么要共享总截止时间？", "否则逐个完整等待会把总延迟按任务数累加。"),
    question("虚拟线程", "虚拟线程是不是可以不做限流？", "不是。线程便宜了，但连接池、数据库和下游容量没有变。"),
  ],
};

const base06 = legacy("14");
const lesson06: FastLesson = {
  ...base06,
  number: "06",
  stage: 2,
  title: "可靠性、排障与综合项目",
  shortTitle: "实战",
  hook: "高并发系统出问题时，先限制损失，再找到线程卡在哪里。",
  lead: "把超时、限流、降级、并发测试、线程转储和多下游聚合服务放在最终一课。",
  outcome: "能设计有上限、能取消、可观测，并且故障时还能返回部分结果的并发服务。",
  duration: "2 × 90 分钟",
  originLessons: "合并原第 14～16 课",
  quickRules: [
    "入口、队列、下游并发和等待时间都要有上限。",
    "故障要区分超时、拒绝、取消和业务失败。",
    "先用线程转储找阻塞点，再用压测和 JFR 找性能原因。",
  ],
  concepts: [
    concept("B", "边界", "并发数、队列长度和等待时间都必须有明确上限。", "只加线程会把压力继续推给下游。"),
    concept("D", "降级", "关键下游失败就失败；非关键失败可以保留部分结果。", "降级规则必须是业务协议，不是随手 catch。"),
    concept("E", "证据", "用可重复测试、线程转储、指标和 JFR 证明问题。", "单次运行正常不能证明并发代码正确。"),
  ],
  zones: [
    zone("R", "聚合请求", "请求内存", "调用线程", "总 deadline + 调用计划", "一次生成整条请求预算。"),
    zone("G", "容量闸门", "堆内存 / 共享", "Semaphore / 有界池", "可用许可", "没有容量就等待、拒绝或降级。"),
    zone("D", "下游调用", "网络与任务状态", "worker", "成功 / 超时 / 失败", "每个调用只完成一次。"),
    zone("O", "响应与指标", "请求结果", "调用方与监控", "OK / PARTIAL / FAILED", "结果、耗时和原因一起返回。"),
  ],
  routes: [
    route("预算与调用计划", "聚合请求", "提交 + 许可", "容量闸门", "进入系统前先受限"),
    route("调用参数", "容量闸门", "受限并发 + timeout", "下游调用", "故障不会无限占用资源"),
    route("结果与原因", "下游调用", "按原顺序收集", "响应与指标", "部分结果可保留、问题可定位"),
  ],
  sourceKeys: ["14-deadline", "15-harness", "16-engine", "16-virtual"],
  interview: [
    question("容量", "为什么队列和等待时间都要有上限？", "防止过载变成内存增长和无限尾延迟，并让系统及时拒绝或降级。"),
    question("排障", "线上线程很多但吞吐下降，先看什么？", "先抓线程转储看 RUNNABLE、BLOCKED、WAITING 分布和共同栈，再结合指标与 JFR。"),
    question("设计", "平台线程池和虚拟线程怎样选？", "根据任务是 CPU 还是阻塞 I/O、依赖限流和运行数据选择；两者都要控制真实资源。"),
  ],
};

export const fastLessons: FastLesson[] = [
  lesson01,
  lesson02,
  lesson03,
  lesson04,
  lesson05,
  lesson06,
];

export function getFastLessonDetail(number: string): FastLesson | undefined {
  return fastLessons.find((lesson) => lesson.number === number);
}

export function getFastLessonSources(lesson: FastLesson): SourceSnippet[] {
  if (lesson.number === "01") {
    return lessonOneSources;
  }
  return getLessonSources(lesson);
}
