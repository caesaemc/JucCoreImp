import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const outputFile = resolve(
  repositoryRoot,
  "web/app/source-snippets.generated.ts",
);
const githubRoot = "https://github.com/caesaemc/JucCoreImp/blob/main/";

const entries = [
  {
    key: "course01-shared",
    tab: "共享变量",
    path: "src/main/java/com/caesaemc/juc/course01/SharedCounterLab.java",
    terms: ["private int value", "value++", "synchronized"],
    note: "字段位于共享堆对象中；普通 ++ 会拆成三步，同一把监视器才能把整个复合更新包起来。",
  },
  {
    key: "course01-lost",
    tab: "丢失更新",
    path: "src/main/java/com/caesaemc/juc/course01/LostUpdateLab.java",
    terms: ["snapshot = state.value", "bothThreadsRead", "allowWriteBack", "state.value ="],
    note: "两个门闩稳定控制“先都读取，再都写回”，因此每次都能复现期望 2、实际 1。",
  },
  {
    key: "course01-hb",
    tab: "start / join",
    path: "src/main/java/com/caesaemc/juc/course01/HappensBeforeLab.java",
    terms: ["state.input = 42", "worker.start", "worker.join", "new Result"],
    note: "start 负责把 input 交给工作线程，join 负责让主线程看到 worker 完成前的 output 写入。",
  },
  {
    key: "course01-exercise",
    tab: "计数器练习",
    path: "src/main/java/com/caesaemc/juc/course01/Course01Exercise.java",
    terms: ["synchronized void increment", "synchronized int value"],
    note: "increment 与 value 使用同一把对象监视器，读写遵循同一个同步协议。",
  },
  {
    key: "course02-visibility",
    tab: "可见性",
    path: "src/main/java/com/caesaemc/juc/course02/VisibilityLab.java",
    terms: ["volatile boolean running", "while (running)", "running = false", "worker.join"],
    note: "volatile 停止标志适合一写多读的独立状态；join 再验收线程已经真正结束。",
  },
  {
    key: "course02-publication",
    tab: "安全发布",
    path: "src/main/java/com/caesaemc/juc/course02/SafePublicationLab.java",
    terms: ["volatile Settings current", "return current", "current = Objects", "record Settings"],
    note: "writer 先构造不可变 Settings，再替换一次 volatile 引用；reader 一次只取得一个完整版本。",
  },
  {
    key: "course02-dcl",
    tab: "DCL 单例",
    path: "src/main/java/com/caesaemc/juc/course02/DclSingleton.java",
    terms: ["volatile DclSingleton", "synchronized", "new DclSingleton", "instance = local"],
    note: "锁内二次检查防止重复创建，volatile 防止其他线程观察到未完整构造的实例。",
  },
  {
    key: "course02-exercise",
    tab: "序号练习",
    path: "src/main/java/com/caesaemc/juc/course02/Course02Exercise.java",
    terms: ["synchronized long next", "++sequence", "synchronized long current"],
    note: "多个方法维护同一个不变量时，要使用同一把锁，而不是只给字段添加 volatile。",
  },
  {
    key: "course03-termination",
    tab: "两阶段终止",
    path: "src/main/java/com/caesaemc/juc/course03/TwoPhaseTerminator.java",
    terms: ["isInterrupted", "catch (InterruptedException", "interrupt()", "finally", "worker.join"],
    note: "interrupt 是停止请求；任务恢复中断、离开循环、在 finally 收尾，调用方再用 join 验收。",
  },
  {
    key: "course03-cas",
    tab: "CAS 循环",
    path: "src/main/java/com/caesaemc/juc/course03/CasCounter.java",
    terms: ["getVolatile", "compareAndSet", "observed + 1"],
    note: "CAS 失败说明 observed 已过期，必须重新读取并重新计算；成功点就是这次递增的线性化点。",
  },
  {
    key: "course03-aqs",
    tab: "AQS 互斥锁",
    path: "src/main/java/com/caesaemc/juc/course03/AqsMutex.java",
    terms: ["sync.acquire", "compareAndSetState", "setExclusiveOwnerThread", "sync.release", "setState(0)"],
    note: "AQS 管理同步队列和阻塞唤醒，Sync 只定义 state 从 0→1 和 1→0 的业务规则。",
  },
  {
    key: "course03-semaphore",
    tab: "资源闸门",
    path: "src/main/java/com/caesaemc/juc/course03/ResourceGate.java",
    terms: ["new Semaphore", "permits.acquire", "active.incrementAndGet", "finally", "permits.release"],
    note: "许可表达真实资源容量；acquire 成功后才进入 try/finally，所有路径都会归还许可。",
  },
  {
    key: "course04-compound",
    tab: "复合竞态",
    path: "src/main/java/com/caesaemc/juc/course04/CompoundActionLab.java",
    terms: ["containsKey", "bothMissed", "allowLoad", "cache.put"],
    note: "containsKey 与 put 之间存在可插入窗口；两个线程可以同时 miss 并重复执行加载。",
  },
  {
    key: "course04-cache",
    tab: "原子缓存",
    path: "src/main/java/com/caesaemc/juc/course04/AtomicCache.java",
    terms: ["ConcurrentHashMap", "computeIfAbsent"],
    note: "把判断和建立交给 ConcurrentHashMap 的原子复合 API；映射函数仍应短小且无递归更新。",
  },
  {
    key: "course04-pipeline",
    tab: "有界流水线",
    path: "src/main/java/com/caesaemc/juc/course04/BoundedPipeline.java",
    terms: ["ArrayBlockingQueue", "queue.take", "item == END", "queue.put"],
    note: "有界队列提供背压，END 是明确的停止协议；消费者不会永久卡在 take。",
  },
  {
    key: "course04-handoff",
    tab: "直接移交",
    path: "src/main/java/com/caesaemc/juc/course04/QueueSemanticsLab.java",
    terms: ["SynchronousQueue", "handoff.put", "handoff.take"],
    note: "SynchronousQueue 不保存元素，一次 put 必须与一次 take 在运行时直接配对。",
  },
  {
    key: "course05-pool",
    tab: "线程池决策",
    path: "src/main/java/com/caesaemc/juc/course05/ThreadPoolDecisionLab.java",
    terms: ["new ThreadPoolExecutor", "executor.execute", "RejectedExecutionException", "new Snapshot"],
    note: "core=1、max=2、queue=1 的确定性实验依次走过核心、入队、扩容和拒绝。",
  },
  {
    key: "course05-deadline",
    tab: "超时取消",
    path: "src/main/java/com/caesaemc/juc/course05/DeadlineRunner.java",
    terms: ["future.get", "TimeoutException", "future.cancel(true)", "ExecutionException"],
    note: "等待超时后显式 cancel(true)；任务是否停止仍取决于任务代码是否协作响应中断。",
  },
  {
    key: "course05-aggregate",
    tab: "异步聚合",
    path: "src/main/java/com/caesaemc/juc/course05/AsyncAggregator.java",
    terms: ["supplyAsync", "handle", "allOf", "result.put"],
    note: "每个调用先归一化为 Outcome，allOf 只协调完成，最后仍按输入 key 收集成功与失败。",
  },
  {
    key: "course05-virtual",
    tab: "虚拟线程",
    path: "src/main/java/com/caesaemc/juc/course05/VirtualThreadLab.java",
    terms: ["newVirtualThreadPerTaskExecutor", "new Semaphore", "permits.acquire", "permits.release"],
    note: "虚拟线程数量与下游资源容量分离；线程可以很多，真正同时占用资源的任务仍受许可限制。",
  },
  {
    key: "course06-deadline",
    tab: "共享预算",
    path: "src/main/java/com/caesaemc/juc/course06/DeadlineBudget.java",
    terms: ["deadlineNanos", "System.nanoTime", "remainingNanos", "Math.min"],
    note: "入口只计算一次绝对 deadline，每一步都从单调时钟重新计算剩余预算。",
  },
  {
    key: "course06-harness",
    tab: "并发测试",
    path: "src/main/java/com/caesaemc/juc/course06/ConcurrentTestHarness.java",
    terms: ["CountDownLatch ready", "CountDownLatch start", "ready.await", "start.countDown", "cancelAll"],
    note: "ready/start 两道门制造确定时序；超时或任一失败都会取消其余 actor。",
  },
  {
    key: "course06-engine",
    tab: "可靠聚合",
    path: "src/main/java/com/caesaemc/juc/course06/ReliableAggregator.java",
    terms: ["DeadlineBudget.start", "executor.submit", "RejectedExecutionException", "future().get", "cancel(true)", "overallStatus"],
    note: "请求共享总预算；提交、许可、执行、超时、取消、稳定终态和有序收集都写进一个协议。",
  },
  {
    key: "course06-strategy",
    tab: "执行策略",
    path: "src/main/java/com/caesaemc/juc/course06/AggregationStrategies.java",
    terms: ["new ThreadPoolExecutor", "ArrayBlockingQueue", "newVirtualThreadPerTaskExecutor", "resourceCapacity"],
    note: "平台线程池与虚拟线程只是执行载体；两种方案都继续用 resourceCapacity 保护真实下游。",
  },
];

const generated = [];

for (const entry of entries) {
  const absolutePath = resolve(repositoryRoot, entry.path);
  const source = await readFile(absolutePath, "utf8");
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const highlights = lines.flatMap((line, index) =>
    entry.terms.some((term) => line.includes(term)) ? [index + 1] : [],
  );
  const startLine = 1;
  const endLine = lines.length;

  generated.push({
    key: entry.key,
    tab: entry.tab,
    filename: entry.path.split("/").at(-1),
    path: entry.path,
    startLine,
    endLine,
    highlights,
    note: entry.note,
    link: `${githubRoot}${entry.path}#L${startLine}-L${endLine}`,
    code: lines.join("\n"),
  });
}

const output = `// 由 scripts/generate-course-sources.mjs 从六课主源码生成。
// 修改 course01～course06 后会在 dev/build 前自动同步。

export type SourceSnippet = {
  key: string;
  tab: string;
  filename: string;
  path: string;
  startLine: number;
  endLine: number;
  highlights: number[];
  note: string;
  link: string;
  code: string;
};

export const sourceSnippets = ${JSON.stringify(generated, null, 2)} as const satisfies readonly SourceSnippet[];

export const sourceSnippetByKey = Object.fromEntries(
  sourceSnippets.map((source) => [source.key, source]),
) as Record<string, SourceSnippet>;
`;

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, output, "utf8");
console.log(`Generated ${generated.length} six-course source snippets → ${outputFile}`);
