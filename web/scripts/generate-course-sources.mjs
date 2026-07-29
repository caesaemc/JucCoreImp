import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const outputFile = resolve(
  repositoryRoot,
  "web/app/source-snippets.generated.ts",
);

const githubRoot =
  "https://github.com/caesaemc/JucCoreImp/blob/main/";

const entries = [
  {
    key: "02-publication",
    tab: "不可变快照",
    path: "src/main/java/com/caesaemc/juc/lesson02/SafePublicationDemo.java",
    startLine: 67,
    endLine: 94,
    highlights: [70, 76, 78, 81, 84, 89, 93],
    note: "先完整构造 Settings，再替换一次 volatile 引用；读线程只取一次引用，所以不会把两个版本的字段混在一起。",
  },
  {
    key: "02-dcl",
    tab: "DCL 单例",
    path: "src/main/java/com/caesaemc/juc/lesson02/DclSingleton.java",
    startLine: 8,
    endLine: 34,
    highlights: [9, 19, 21, 22, 24, 25, 27, 29, 33],
    note: "第一次检查避免每次加锁，锁内第二次检查避免重复创建；volatile 把完整对象交给其他线程。",
  },
  {
    key: "02-exercise",
    tab: "序号练习",
    path: "src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java",
    startLine: 8,
    endLine: 19,
    highlights: [9, 11, 12, 13, 16, 17, 18],
    note: "volatile 只能让新值可见，不能把 ++ 合成一个动作；练习要求 next 与 current 使用同一把锁。",
  },
  {
    key: "03-termination",
    tab: "两阶段终止",
    path: "src/main/java/com/caesaemc/juc/lesson03/TwoPhaseTerminator.java",
    startLine: 39,
    endLine: 65,
    highlights: [42, 44, 46, 48, 51, 52, 61, 62],
    note: "interrupt 只是停止请求；工作线程恢复中断、离开循环，并在 finally 中完成终态通知，调用者再 join 验收。",
  },
  {
    key: "03-mailbox",
    tab: "保护性暂停",
    path: "src/main/java/com/caesaemc/juc/lesson03/GuardedMailbox.java",
    startLine: 13,
    endLine: 33,
    highlights: [15, 17, 20, 21, 26, 30, 31, 32],
    note: "等待线程共享一个绝对截止时间，每次唤醒重算剩余预算；条件写入和 notifyAll 受同一监视器保护。",
  },
  {
    key: "03-exercise",
    tab: "取消练习",
    path: "src/main/java/com/caesaemc/juc/lesson03/CancellationExercise.java",
    startLine: 13,
    endLine: 22,
    highlights: [15, 17, 19, 20],
    note: "InterruptedException 会清除中断标志；空 catch 会吞掉取消协议，必须恢复中断并退出循环。",
  },
  {
    key: "04-cas",
    tab: "CAS 循环",
    path: "src/main/java/com/caesaemc/juc/lesson04/VarHandleCounter.java",
    startLine: 24,
    endLine: 37,
    highlights: [25, 28, 29, 30, 31, 32, 36, 37],
    note: "每次失败都重新读取 observed 并计算 next；成功的 compareAndSet 是这次递增的线性化点。",
  },
  {
    key: "04-aba",
    tab: "ABA 时间线",
    path: "src/main/java/com/caesaemc/juc/lesson04/AbaDemo.java",
    startLine: 14,
    endLine: 30,
    highlights: [16, 17, 18, 19, 23, 24, 25, 26, 27, 28],
    note: "普通引用只看到最终仍为 A；带戳引用同时比较版本，能发现 A→B→A 的中间历史。",
  },
  {
    key: "04-exercise",
    tab: "余额练习",
    path: "src/main/java/com/caesaemc/juc/lesson04/BoundedBalanceExercise.java",
    startLine: 10,
    endLine: 27,
    highlights: [10, 16, 17, 18, 21],
    note: "余额检查和扣减必须放进同一 CAS 重试循环；分离的 get/set 会在并发下突破余额不为负的不变量。",
  },
  {
    key: "05-mutex",
    tab: "AQS 互斥锁",
    path: "src/main/java/com/caesaemc/juc/lesson05/Mutex.java",
    startLine: 53,
    endLine: 80,
    highlights: [56, 57, 58, 65, 66, 69, 70, 75, 79, 80],
    note: "子类只定义 state 成功/释放规则；AQS 负责失败线程的入队、park、唤醒、中断和取消。",
  },
  {
    key: "05-condition",
    tab: "双条件队列",
    path: "src/main/java/com/caesaemc/juc/lesson05/BoundedBuffer.java",
    startLine: 30,
    endLine: 60,
    highlights: [31, 33, 34, 38, 39, 41, 47, 49, 50, 55, 56, 59],
    note: "notFull 与 notEmpty 分离等待者；await 释放锁，signal 后节点仍需转移到同步队列重新竞争。",
  },
  {
    key: "05-exercise",
    tab: "共享模式练习",
    path: "src/main/java/com/caesaemc/juc/lesson05/OneShotLatchExercise.java",
    startLine: 12,
    endLine: 35,
    highlights: [12, 13, 16, 17, 27, 28, 32, 33, 34],
    note: "打开前共享获取失败并排队；state 变为 1 后释放传播唤醒，现有与未来调用者都可直接通过。",
  },
  {
    key: "06-semaphore",
    tab: "资源闸门",
    path: "src/main/java/com/caesaemc/juc/lesson06/ResourceGate.java",
    startLine: 24,
    endLine: 34,
    highlights: [26, 27, 28, 29, 30, 31, 32, 33],
    note: "许可代表真实稀缺资源；只有 acquire 成功后才进入 try/finally，异常路径也不会泄漏容量。",
  },
  {
    key: "06-stamped",
    tab: "乐观读取",
    path: "src/main/java/com/caesaemc/juc/lesson06/StampedPoint.java",
    startLine: 14,
    endLine: 37,
    highlights: [15, 20, 25, 26, 27, 28, 29, 31, 32, 34],
    note: "乐观读先复制普通字段到局部变量，再 validate；验证失败必须持读锁重新复制，不能继续使用旧快照。",
  },
  {
    key: "06-exercise",
    tab: "许可练习",
    path: "src/main/java/com/caesaemc/juc/lesson06/PermitGuardExercise.java",
    startLine: 17,
    endLine: 22,
    highlights: [18, 19, 20, 21],
    note: "当前实现遇到 action 异常就跳过 release；练习要求用 finally 覆盖正常、受检异常和运行时异常。",
  },
  {
    key: "07-compound",
    tab: "复合竞态",
    path: "src/main/java/com/caesaemc/juc/lesson07/CompoundActionDemo.java",
    startLine: 15,
    endLine: 65,
    highlights: [22, 23, 24, 26, 27, 40, 43, 51, 52, 53, 65],
    note: "containsKey 与 put 各自安全但组合不原子；computeIfAbsent 把同 key 的判断和建立合并到容器协议中。",
  },
  {
    key: "07-cache",
    tab: "原子缓存",
    path: "src/main/java/com/caesaemc/juc/lesson07/ConcurrentCache.java",
    startLine: 10,
    endLine: 29,
    highlights: [12, 13, 19, 20, 23, 24],
    note: "映射函数应短小、无递归更新；远程慢加载需要进一步使用 Future 单飞、超时和失败清除。",
  },
  {
    key: "07-exercise",
    tab: "缓存练习",
    path: "src/main/java/com/caesaemc/juc/lesson07/CacheExercise.java",
    startLine: 14,
    endLine: 26,
    highlights: [15, 16, 17, 18, 19, 24, 25],
    note: "两个线程可以同时看到 null 并各自执行 load；练习目标是让同 key 的加载成为一个原子复合操作。",
  },
  {
    key: "08-pipeline",
    tab: "有界流水线",
    path: "src/main/java/com/caesaemc/juc/lesson08/BoundedPipeline.java",
    startLine: 18,
    endLine: 52,
    highlights: [23, 30, 31, 32, 35, 40, 45, 46, 48, 49, 51],
    note: "ArrayBlockingQueue 同时传递数据和表达容量；put 在满载时把压力传回生产者，poison pill 明确结束消费者。",
  },
  {
    key: "08-handoff",
    tab: "直接移交",
    path: "src/main/java/com/caesaemc/juc/lesson08/QueueSemanticsDemo.java",
    startLine: 16,
    endLine: 27,
    highlights: [17, 18, 20, 25, 26],
    note: "SynchronousQueue 容量为零，生产者的 put 必须与消费者的 take 配对，不在队列中存储元素。",
  },
  {
    key: "08-exercise",
    tab: "批处理练习",
    path: "src/main/java/com/caesaemc/juc/lesson08/BatchingQueueExercise.java",
    startLine: 12,
    endLine: 21,
    highlights: [12, 18, 19, 20],
    note: "先 take 阻塞取得第一个元素，再 drainTo 非阻塞补满批次，既不空转也不等待凑齐整个批次。",
  },
  {
    key: "09-decision",
    tab: "execute 决策",
    path: "src/main/java/com/caesaemc/juc/lesson09/ThreadPoolDecisionModel.java",
    startLine: 11,
    endLine: 30,
    highlights: [18, 21, 22, 24, 25, 27, 28, 30],
    note: "提交路径依次尝试核心 Worker、队列、非核心 Worker，最后拒绝；队列策略决定 max 是否真正参与。",
  },
  {
    key: "09-saturation",
    tab: "饱和实验",
    path: "src/main/java/com/caesaemc/juc/lesson09/PoolSaturationDemo.java",
    startLine: 15,
    endLine: 50,
    highlights: [16, 17, 18, 30, 31, 32, 37, 40, 41, 44, 45],
    note: "core=1、max=2、queue=1 时，前三个阻塞任务走完三条接收路径，第四个得到明确拒绝信号。",
  },
  {
    key: "09-exercise",
    tab: "配置练习",
    path: "src/main/java/com/caesaemc/juc/lesson09/PoolConfigExercise.java",
    startLine: 9,
    endLine: 17,
    highlights: [14, 15, 16],
    note: "便捷工厂隐藏无界队列和拒绝语义；练习要求显式构造容量、线程名称与拒绝策略。",
  },
  {
    key: "10-deadline",
    tab: "超时取消",
    path: "src/main/java/com/caesaemc/juc/lesson10/DeadlineTaskRunner.java",
    startLine: 22,
    endLine: 35,
    highlights: [24, 27, 29, 30, 31, 32, 33],
    note: "TimeoutException 只说明调用者不再等待；cancel(true) 发出中断请求，任务是否真正停止取决于执行层协作。",
  },
  {
    key: "10-shutdown",
    tab: "优雅关闭",
    path: "src/main/java/com/caesaemc/juc/lesson10/GracefulExecutor.java",
    startLine: 16,
    endLine: 37,
    highlights: [21, 23, 27, 28, 33, 34, 35],
    note: "关闭协议先拒绝新任务并等待排空，超时再中断；调用线程被中断时还要恢复自己的中断状态。",
  },
  {
    key: "10-exercise",
    tab: "关闭练习",
    path: "src/main/java/com/caesaemc/juc/lesson10/ShutdownExercise.java",
    startLine: 9,
    endLine: 18,
    highlights: [14, 15, 16, 17],
    note: "当前实现没有等待、强制阶段和总预算；练习需要完成 shutdown → await → shutdownNow 的完整协议。",
  },
  {
    key: "11-aggregate",
    tab: "多结果聚合",
    path: "src/main/java/com/caesaemc/juc/lesson11/AsyncAggregator.java",
    startLine: 25,
    endLine: 47,
    highlights: [29, 31, 32, 33, 34, 35, 36, 40, 42, 43, 45, 46],
    note: "每个来源先转为 Outcome，失败不会抹掉其他成功结果；allOf 只协调完成，原始 Future 保留类型化数据。",
  },
  {
    key: "11-composition",
    tab: "依赖与合并",
    path: "src/main/java/com/caesaemc/juc/lesson11/CompositionDemo.java",
    startLine: 14,
    endLine: 27,
    highlights: [19, 22, 26],
    note: "依赖异步调用使用 thenCompose 展平；两个独立上游并行启动后使用 thenCombine 合并。",
  },
  {
    key: "11-exercise",
    tab: "编排练习",
    path: "src/main/java/com/caesaemc/juc/lesson11/CompositionExercise.java",
    startLine: 14,
    endLine: 29,
    highlights: [19, 20, 23, 28, 29],
    note: "thenApply 返回嵌套 Future；练习要求 loadFlat 返回单层 CompletableFuture，并保留正确的数据依赖。",
  },
  {
    key: "12-forkjoin",
    tab: "分治任务",
    path: "src/main/java/com/caesaemc/juc/lesson12/ParallelSumTask.java",
    startLine: 26,
    endLine: 42,
    highlights: [28, 29, 30, 33, 36, 37, 38, 39, 40, 41],
    note: "小任务顺序计算；大任务 fork 一个分支、当前线程 compute 另一个，再 join 合并，减少无效调度。",
  },
  {
    key: "12-blocker",
    tab: "阻塞补偿",
    path: "src/main/java/com/caesaemc/juc/lesson12/ManagedBlockerDemo.java",
    startLine: 14,
    endLine: 46,
    highlights: [15, 16, 20, 29, 30, 33, 36, 41, 42, 45],
    note: "ManagedBlocker 把即将阻塞的信息告诉 ForkJoinPool，使其有机会评估补偿；它不会替代超时或资源限流。",
  },
  {
    key: "12-exercise",
    tab: "最大值练习",
    path: "src/main/java/com/caesaemc/juc/lesson12/MaxTaskExercise.java",
    startLine: 24,
    endLine: 28,
    highlights: [25, 26, 27],
    note: "练习需要补齐阈值、左右拆分、fork/compute/join 与合并，并拒绝空数组。",
  },
  {
    key: "13-virtual",
    tab: "每任务一线程",
    path: "src/main/java/com/caesaemc/juc/lesson13/VirtualThreadAggregator.java",
    startLine: 20,
    endLine: 43,
    highlights: [24, 25, 27, 31, 32, 33, 36, 37, 38, 39, 42],
    note: "虚拟线程承载大量独立阻塞任务，invokeAll 的同一 timeout 约束整组任务，取消结果被显式保留。",
  },
  {
    key: "13-capacity",
    tab: "资源容量",
    path: "src/main/java/com/caesaemc/juc/lesson13/LimitedVirtualThreadService.java",
    startLine: 24,
    endLine: 46,
    highlights: [25, 28, 29, 30, 31, 32, 34, 35, 36, 42, 43],
    note: "虚拟线程数量与外部资源容量分离：每任务一个线程，Semaphore 单独限制真正的在途资源。",
  },
  {
    key: "13-exercise",
    tab: "迁移练习",
    path: "src/main/java/com/caesaemc/juc/lesson13/VirtualResourceExercise.java",
    startLine: 16,
    endLine: 26,
    highlights: [16, 17, 18, 21, 25, 26],
    note: "破损版本既泄漏执行器，也没有资源背压；练习要求限定生命周期并用 Semaphore 保护下游。",
  },
  {
    key: "14-deadline",
    tab: "共享预算",
    path: "src/main/java/com/caesaemc/juc/lesson14/DeadlineBudget.java",
    startLine: 17,
    endLine: 51,
    highlights: [23, 24, 27, 31, 38, 39, 42, 46, 51],
    note: "入口只计算一次绝对 deadline；每一步从单调时钟重新计算剩余时间，并与单步上限取最小值。",
  },
  {
    key: "14-memoizer",
    tab: "单飞缓存",
    path: "src/main/java/com/caesaemc/juc/lesson14/Memoizer.java",
    startLine: 18,
    endLine: 41,
    highlights: [22, 23, 24, 25, 26, 27, 29, 34, 35, 36, 37, 38, 39],
    note: "缓存 Future 让并发调用者共享正在进行的计算；失败或取消后条件删除，下一次调用可以重试。",
  },
  {
    key: "14-exercise",
    tab: "Bulkhead 练习",
    path: "src/main/java/com/caesaemc/juc/lesson14/BulkheadExercise.java",
    startLine: 9,
    endLine: 22,
    highlights: [11, 12, 15, 17, 18, 20, 21],
    note: "练习把容量、限时等待、超时降级和许可释放写进同一个调用协议，并保留中断语义。",
  },
  {
    key: "15-harness",
    tab: "确定性测试",
    path: "src/main/java/com/caesaemc/juc/lesson15/ConcurrentTestHarness.java",
    startLine: 25,
    endLine: 74,
    highlights: [34, 35, 36, 45, 46, 47, 52, 53, 56, 60, 61, 62, 66, 67, 70, 73],
    note: "ready/start 两个门闩建立可控时序，准备和结果收集共享一个 deadline，任何失败都会取消其余 actor。",
  },
  {
    key: "15-diagnostic",
    tab: "堆积故障",
    path: "src/main/java/com/caesaemc/juc/lesson15/DiagnosticFaultLab.java",
    startLine: 62,
    endLine: 89,
    highlights: [63, 64, 65, 66, 69, 70, 71, 72, 76, 77, 80, 82, 86, 87],
    note: "两个 worker 被锁存器占满，后续 80 个任务稳定堆积；线程 dump 与 metrics 共同形成根因证据。",
  },
  {
    key: "15-exercise",
    tab: "竞态练习",
    path: "src/main/java/com/caesaemc/juc/lesson15/DeterministicRaceExercise.java",
    startLine: 6,
    endLine: 14,
    highlights: [11, 12, 13],
    note: "目标不是增加随机概率，而是用两个阶段的同步点稳定构造“先都读，再都写”的合法交错。",
  },
  {
    key: "16-engine",
    tab: "聚合主线",
    path: "src/main/java/com/caesaemc/juc/lesson16/AbstractAggregationService.java",
    startLine: 57,
    endLine: 148,
    highlights: [65, 66, 69, 72, 73, 74, 76, 88, 89, 95, 97, 113, 133, 135, 136, 137, 145],
    note: "一次请求共享 DeadlineBudget；每个下游独立定时取消，提交失败进入 REJECTED，结果按原输入顺序收集。",
  },
  {
    key: "16-platform",
    tab: "平台线程",
    path: "src/main/java/com/caesaemc/juc/lesson16/PlatformAggregationService.java",
    startLine: 25,
    endLine: 42,
    highlights: [34, 35, 36, 39, 40, 41],
    note: "固定 worker 控制平台线程，有界队列控制排队内存，AbortPolicy 把满载变成可观察的背压信号。",
  },
  {
    key: "16-virtual",
    tab: "虚拟线程",
    path: "src/main/java/com/caesaemc/juc/lesson16/VirtualAggregationService.java",
    startLine: 8,
    endLine: 18,
    highlights: [11, 13, 14, 16],
    note: "每个下游一个虚拟线程；resourceCapacity 仍交给共享 Semaphore，执行载体和资源容量不混为一谈。",
  },
  {
    key: "16-exercise",
    tab: "降级练习",
    path: "src/main/java/com/caesaemc/juc/lesson16/DegradationPolicyExercise.java",
    startLine: 6,
    endLine: 20,
    highlights: [11, 12, 13, 16, 17, 18, 19],
    note: "底层并发组件只输出稳定终态；接口层再把关键/非关键结果映射为 OK、PARTIAL、FAILED。",
  },
];

const generated = [];

for (const entry of entries) {
  const absolutePath = resolve(repositoryRoot, entry.path);
  const source = await readFile(absolutePath, "utf8");
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (entry.startLine < 1 || entry.endLine > lines.length) {
    throw new Error(
      `${entry.key} 的行号范围 ${entry.startLine}-${entry.endLine} 超出 ${entry.path}`,
    );
  }
  const code = lines.slice(entry.startLine - 1, entry.endLine).join("\n");
  generated.push({
    ...entry,
    filename: entry.path.split("/").at(-1),
    link: `${githubRoot}${entry.path}#L${entry.startLine}-L${entry.endLine}`,
    code,
  });
}

const output = `// 由 scripts/generate-course-sources.mjs 从真实 Java 源码生成。
// 修改源码或行号后请重新运行：node scripts/generate-course-sources.mjs

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
console.log(`Generated ${generated.length} source snippets → ${outputFile}`);
