// 由 scripts/generate-course-sources.mjs 从六课主源码生成。
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

export const sourceSnippets = [
  {
    "key": "course01-shared",
    "tab": "共享变量",
    "filename": "SharedCounterLab.java",
    "path": "src/main/java/com/caesaemc/juc/course01/SharedCounterLab.java",
    "startLine": 1,
    "endLine": 36,
    "highlights": [
      12,
      16,
      25,
      27,
      28,
      31
    ],
    "note": "字段位于共享堆对象中；普通 ++ 会拆成三步，同一把监视器才能把整个复合更新包起来。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/SharedCounterLab.java#L1-L36",
    "code": "package com.caesaemc.juc.course01;\n\n/**\n * 第一课的最小共享变量：字段在堆对象中，多个线程共同读写它。\n */\npublic final class SharedCounterLab {\n\n    private SharedCounterLab() {\n    }\n\n    public static final class UnsafeCounter {\n        private int value;\n\n        public void increment() {\n            // 这一行会被拆成“读取、加一、写回”，并不是一个原子动作。\n            value++;\n        }\n\n        public int value() {\n            return value;\n        }\n    }\n\n    public static final class LockedCounter {\n        private int value;\n\n        public synchronized void increment() {\n            value++;\n        }\n\n        public synchronized int value() {\n            return value;\n        }\n    }\n}\n"
  },
  {
    "key": "course01-lost",
    "tab": "丢失更新",
    "filename": "LostUpdateLab.java",
    "path": "src/main/java/com/caesaemc/juc/course01/LostUpdateLab.java",
    "startLine": 1,
    "endLine": 45,
    "highlights": [
      15,
      16,
      19,
      20,
      22,
      23,
      34,
      35
    ],
    "note": "两个门闩稳定控制“先都读取，再都写回”，因此每次都能复现期望 2、实际 1。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/LostUpdateLab.java#L1-L45",
    "code": "package com.caesaemc.juc.course01;\n\nimport java.util.concurrent.CountDownLatch;\n\n/**\n * 用两个同步点稳定构造一次丢失更新，而不是靠多跑几次碰运气。\n */\npublic final class LostUpdateLab {\n\n    private LostUpdateLab() {\n    }\n\n    public static int reproduce() throws InterruptedException {\n        State state = new State();\n        CountDownLatch bothThreadsRead = new CountDownLatch(2);\n        CountDownLatch allowWriteBack = new CountDownLatch(1);\n\n        Runnable increment = () -> {\n            int snapshot = state.value;\n            bothThreadsRead.countDown();\n            try {\n                allowWriteBack.await();\n                state.value = snapshot + 1;\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        };\n\n        Thread first = new Thread(increment, \"course01-counter-a\");\n        Thread second = new Thread(increment, \"course01-counter-b\");\n        first.start();\n        second.start();\n\n        bothThreadsRead.await();\n        allowWriteBack.countDown();\n        first.join();\n        second.join();\n        return state.value;\n    }\n\n    private static final class State {\n        private int value;\n    }\n}\n"
  },
  {
    "key": "course01-hb",
    "tab": "start / join",
    "filename": "HappensBeforeLab.java",
    "path": "src/main/java/com/caesaemc/juc/course01/HappensBeforeLab.java",
    "startLine": 1,
    "endLine": 34,
    "highlights": [
      13,
      20,
      21,
      22
    ],
    "note": "start 负责把 input 交给工作线程，join 负责让主线程看到 worker 完成前的 output 写入。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/HappensBeforeLab.java#L1-L34",
    "code": "package com.caesaemc.juc.course01;\n\n/**\n * start 把调用线程之前的写交给工作线程，join 把工作线程的写带回调用线程。\n */\npublic final class HappensBeforeLab {\n\n    private HappensBeforeLab() {\n    }\n\n    public static Result run() throws InterruptedException {\n        State state = new State();\n        state.input = 42;\n\n        Thread worker = new Thread(() -> {\n            state.observedInput = state.input;\n            state.output = state.input * 2;\n        }, \"course01-happens-before\");\n\n        worker.start();\n        worker.join();\n        return new Result(state.observedInput, state.output);\n    }\n\n    private static final class State {\n        private int input;\n        private int observedInput;\n        private int output;\n    }\n\n    public record Result(int observedInput, int outputAfterJoin) {\n    }\n}\n"
  },
  {
    "key": "course01-exercise",
    "tab": "计数器练习",
    "filename": "Course01Exercise.java",
    "path": "src/main/java/com/caesaemc/juc/course01/Course01Exercise.java",
    "startLine": 1,
    "endLine": 18,
    "highlights": [
      10,
      14
    ],
    "note": "increment 与 value 使用同一把对象监视器，读写遵循同一个同步协议。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/Course01Exercise.java#L1-L18",
    "code": "package com.caesaemc.juc.course01;\n\n/**\n * 第一课练习参考实现：不用原子类，使用同一把监视器保护读写。\n */\npublic final class Course01Exercise {\n\n    private int value;\n\n    public synchronized void increment() {\n        value++;\n    }\n\n    public synchronized int value() {\n        return value;\n    }\n}\n"
  },
  {
    "key": "course02-visibility",
    "tab": "可见性",
    "filename": "VisibilityLab.java",
    "path": "src/main/java/com/caesaemc/juc/course02/VisibilityLab.java",
    "startLine": 1,
    "endLine": 37,
    "highlights": [
      10,
      19,
      28,
      30
    ],
    "note": "volatile 停止标志适合一写多读的独立状态；join 再验收线程已经真正结束。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/VisibilityLab.java#L1-L37",
    "code": "package com.caesaemc.juc.course02;\n\nimport java.time.Duration;\n\n/**\n * volatile 适合发布独立状态，例如停止标志；它不提供复合更新的互斥。\n */\npublic final class VisibilityLab implements AutoCloseable {\n\n    private volatile boolean running;\n    private Thread worker;\n\n    public void start() {\n        if (running) {\n            throw new IllegalStateException(\"任务已经启动\");\n        }\n        running = true;\n        worker = new Thread(() -> {\n            while (running) {\n                Thread.onSpinWait();\n            }\n        }, \"course02-visibility\");\n        worker.start();\n    }\n\n    @Override\n    public void close() throws InterruptedException {\n        running = false;\n        if (worker != null) {\n            worker.join(Duration.ofSeconds(1).toMillis());\n            if (worker.isAlive()) {\n                throw new IllegalStateException(\"工作线程没有观察到停止标志\");\n            }\n        }\n    }\n}\n"
  },
  {
    "key": "course02-publication",
    "tab": "安全发布",
    "filename": "SafePublicationLab.java",
    "path": "src/main/java/com/caesaemc/juc/course02/SafePublicationLab.java",
    "startLine": 1,
    "endLine": 39,
    "highlights": [
      14,
      17,
      22,
      27,
      31
    ],
    "note": "writer 先构造不可变 Settings，再替换一次 volatile 引用；reader 一次只取得一个完整版本。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/SafePublicationLab.java#L1-L39",
    "code": "package com.caesaemc.juc.course02;\n\nimport java.util.Objects;\n\n/**\n * 先构造不可变快照，再通过一次 volatile 引用写完成安全发布。\n */\npublic final class SafePublicationLab {\n\n    private SafePublicationLab() {\n    }\n\n    public static final class ConfigRepository {\n        private volatile Settings current;\n\n        public ConfigRepository(Settings initial) {\n            current = Objects.requireNonNull(initial, \"initial\");\n        }\n\n        public Settings snapshot() {\n            // 读一次共享入口，后续字段都来自同一个版本。\n            return current;\n        }\n\n        public void update(Settings settings) {\n            // settings 已完整构造；这一步只替换引用，不逐字段修改旧对象。\n            current = Objects.requireNonNull(settings, \"settings\");\n        }\n    }\n\n    public record Settings(int version, int timeoutMillis, int retries) {\n        public Settings {\n            if (version < 0 || timeoutMillis <= 0 || retries < 0) {\n                throw new IllegalArgumentException(\"配置值不合法\");\n            }\n        }\n    }\n}\n"
  },
  {
    "key": "course02-dcl",
    "tab": "DCL 单例",
    "filename": "DclSingleton.java",
    "path": "src/main/java/com/caesaemc/juc/course02/DclSingleton.java",
    "startLine": 1,
    "endLine": 34,
    "highlights": [
      8,
      19,
      22,
      23
    ],
    "note": "锁内二次检查防止重复创建，volatile 防止其他线程观察到未完整构造的实例。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/DclSingleton.java#L1-L34",
    "code": "package com.caesaemc.juc.course02;\n\n/**\n * 正确的双重检查锁：锁内防止重复创建，volatile 负责发布完整对象。\n */\npublic final class DclSingleton {\n\n    private static volatile DclSingleton instance;\n\n    private final long createdAtNanos;\n\n    private DclSingleton() {\n        createdAtNanos = System.nanoTime();\n    }\n\n    public static DclSingleton instance() {\n        DclSingleton local = instance;\n        if (local == null) {\n            synchronized (DclSingleton.class) {\n                local = instance;\n                if (local == null) {\n                    local = new DclSingleton();\n                    instance = local;\n                }\n            }\n        }\n        return local;\n    }\n\n    public long createdAtNanos() {\n        return createdAtNanos;\n    }\n}\n"
  },
  {
    "key": "course02-exercise",
    "tab": "序号练习",
    "filename": "Course02Exercise.java",
    "path": "src/main/java/com/caesaemc/juc/course02/Course02Exercise.java",
    "startLine": 1,
    "endLine": 18,
    "highlights": [
      10,
      11,
      14
    ],
    "note": "多个方法维护同一个不变量时，要使用同一把锁，而不是只给字段添加 volatile。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/Course02Exercise.java#L1-L18",
    "code": "package com.caesaemc.juc.course02;\n\n/**\n * 第二课练习参考实现：next 和 current 必须使用同一把锁。\n */\npublic final class Course02Exercise {\n\n    private long sequence;\n\n    public synchronized long next() {\n        return ++sequence;\n    }\n\n    public synchronized long current() {\n        return sequence;\n    }\n}\n"
  },
  {
    "key": "course03-termination",
    "tab": "两阶段终止",
    "filename": "TwoPhaseTerminator.java",
    "path": "src/main/java/com/caesaemc/juc/course03/TwoPhaseTerminator.java",
    "startLine": 1,
    "endLine": 68,
    "highlights": [
      10,
      42,
      46,
      48,
      51,
      61,
      62
    ],
    "note": "interrupt 是停止请求；任务恢复中断、离开循环、在 finally 收尾，调用方再用 join 验收。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/TwoPhaseTerminator.java#L1-L68",
    "code": "package com.caesaemc.juc.course03;\n\nimport java.time.Duration;\nimport java.util.concurrent.CountDownLatch;\nimport java.util.concurrent.TimeUnit;\nimport java.util.concurrent.atomic.AtomicBoolean;\nimport java.util.concurrent.atomic.AtomicInteger;\n\n/**\n * 第一阶段用 interrupt 请求停止，第二阶段由任务在 finally 中完成收尾。\n */\npublic final class TwoPhaseTerminator implements AutoCloseable {\n\n    private final AtomicBoolean started = new AtomicBoolean();\n    private final AtomicInteger cycles = new AtomicInteger();\n    private final CountDownLatch running = new CountDownLatch(1);\n    private final CountDownLatch stopped = new CountDownLatch(1);\n    private final Thread worker = new Thread(this::runLoop, \"course03-terminator\");\n\n    public void start() {\n        if (!started.compareAndSet(false, true)) {\n            throw new IllegalStateException(\"任务只能启动一次\");\n        }\n        worker.start();\n    }\n\n    public boolean awaitRunning(Duration timeout) throws InterruptedException {\n        return running.await(timeout.toMillis(), TimeUnit.MILLISECONDS);\n    }\n\n    public int cycles() {\n        return cycles.get();\n    }\n\n    public boolean isStopped() {\n        return stopped.getCount() == 0;\n    }\n\n    private void runLoop() {\n        running.countDown();\n        try {\n            while (!Thread.currentThread().isInterrupted()) {\n                try {\n                    TimeUnit.MILLISECONDS.sleep(5);\n                    cycles.incrementAndGet();\n                } catch (InterruptedException exception) {\n                    // sleep 清除了标志；恢复标志，循环条件才能看到停止请求。\n                    Thread.currentThread().interrupt();\n                }\n            }\n        } finally {\n            stopped.countDown();\n        }\n    }\n\n    @Override\n    public void close() throws InterruptedException {\n        if (!started.get()) {\n            return;\n        }\n        worker.interrupt();\n        worker.join(Duration.ofSeconds(1).toMillis());\n        if (worker.isAlive()) {\n            throw new IllegalStateException(\"工作线程没有按时停止\");\n        }\n    }\n}\n"
  },
  {
    "key": "course03-cas",
    "tab": "CAS 循环",
    "filename": "CasCounter.java",
    "path": "src/main/java/com/caesaemc/juc/course03/CasCounter.java",
    "startLine": 1,
    "endLine": 35,
    "highlights": [
      7,
      27,
      28,
      32
    ],
    "note": "CAS 失败说明 observed 已过期，必须重新读取并重新计算；成功点就是这次递增的线性化点。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/CasCounter.java#L1-L35",
    "code": "package com.caesaemc.juc.course03;\n\nimport java.lang.invoke.MethodHandles;\nimport java.lang.invoke.VarHandle;\n\n/**\n * CAS 的线性化点是 compareAndSet 成功的瞬间；失败线程重新读取后再计算。\n */\npublic final class CasCounter {\n\n    private static final VarHandle VALUE;\n\n    static {\n        try {\n            VALUE = MethodHandles.lookup().findVarHandle(CasCounter.class, \"value\", int.class);\n        } catch (ReflectiveOperationException exception) {\n            throw new ExceptionInInitializerError(exception);\n        }\n    }\n\n    @SuppressWarnings(\"FieldMayBeFinal\")\n    private volatile int value;\n\n    public void increment() {\n        int observed;\n        do {\n            observed = (int) VALUE.getVolatile(this);\n        } while (!VALUE.compareAndSet(this, observed, observed + 1));\n    }\n\n    public int value() {\n        return (int) VALUE.getVolatile(this);\n    }\n}\n"
  },
  {
    "key": "course03-aqs",
    "tab": "AQS 互斥锁",
    "filename": "AqsMutex.java",
    "path": "src/main/java/com/caesaemc/juc/course03/AqsMutex.java",
    "startLine": 1,
    "endLine": 80,
    "highlights": [
      17,
      22,
      37,
      53,
      54,
      65,
      66
    ],
    "note": "AQS 管理同步队列和阻塞唤醒，Sync 只定义 state 从 0→1 和 1→0 的业务规则。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/AqsMutex.java#L1-L80",
    "code": "package com.caesaemc.juc.course03;\n\nimport java.util.concurrent.TimeUnit;\nimport java.util.concurrent.locks.AbstractQueuedSynchronizer;\nimport java.util.concurrent.locks.Condition;\nimport java.util.concurrent.locks.Lock;\n\n/**\n * 不可重入互斥锁：子类只定义 state 规则，AQS 管理排队、阻塞和唤醒。\n */\npublic final class AqsMutex implements Lock {\n\n    private final Sync sync = new Sync();\n\n    @Override\n    public void lock() {\n        sync.acquire(1);\n    }\n\n    @Override\n    public void lockInterruptibly() throws InterruptedException {\n        sync.acquireInterruptibly(1);\n    }\n\n    @Override\n    public boolean tryLock() {\n        return sync.tryAcquire(1);\n    }\n\n    @Override\n    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {\n        return sync.tryAcquireNanos(1, unit.toNanos(time));\n    }\n\n    @Override\n    public void unlock() {\n        sync.release(1);\n    }\n\n    @Override\n    public Condition newCondition() {\n        return sync.newCondition();\n    }\n\n    public boolean hasQueuedThreads() {\n        return sync.hasQueuedThreads();\n    }\n\n    private static final class Sync extends AbstractQueuedSynchronizer {\n\n        @Override\n        protected boolean tryAcquire(int ignored) {\n            if (compareAndSetState(0, 1)) {\n                setExclusiveOwnerThread(Thread.currentThread());\n                return true;\n            }\n            return false;\n        }\n\n        @Override\n        protected boolean tryRelease(int ignored) {\n            if (getState() == 0 || getExclusiveOwnerThread() != Thread.currentThread()) {\n                throw new IllegalMonitorStateException(\"当前线程不是锁持有者\");\n            }\n            setExclusiveOwnerThread(null);\n            setState(0);\n            return true;\n        }\n\n        @Override\n        protected boolean isHeldExclusively() {\n            return getState() == 1 && getExclusiveOwnerThread() == Thread.currentThread();\n        }\n\n        private Condition newCondition() {\n            return new ConditionObject();\n        }\n    }\n}\n"
  },
  {
    "key": "course03-semaphore",
    "tab": "资源闸门",
    "filename": "ResourceGate.java",
    "path": "src/main/java/com/caesaemc/juc/course03/ResourceGate.java",
    "startLine": 1,
    "endLine": 45,
    "highlights": [
      21,
      26,
      27,
      31,
      33
    ],
    "note": "许可表达真实资源容量；acquire 成功后才进入 try/finally，所有路径都会归还许可。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/ResourceGate.java#L1-L45",
    "code": "package com.caesaemc.juc.course03;\n\nimport java.util.Objects;\nimport java.util.concurrent.Callable;\nimport java.util.concurrent.Semaphore;\nimport java.util.concurrent.atomic.AtomicInteger;\n\n/**\n * 线程数量和资源容量是两件事；Semaphore 单独表达真实资源的上限。\n */\npublic final class ResourceGate {\n\n    private final Semaphore permits;\n    private final AtomicInteger active = new AtomicInteger();\n    private final AtomicInteger maxObserved = new AtomicInteger();\n\n    public ResourceGate(int capacity) {\n        if (capacity <= 0) {\n            throw new IllegalArgumentException(\"capacity 必须大于 0\");\n        }\n        permits = new Semaphore(capacity, true);\n    }\n\n    public <T> T call(Callable<T> action) throws Exception {\n        Objects.requireNonNull(action, \"action\");\n        permits.acquire();\n        int now = active.incrementAndGet();\n        maxObserved.accumulateAndGet(now, Math::max);\n        try {\n            return action.call();\n        } finally {\n            active.decrementAndGet();\n            permits.release();\n        }\n    }\n\n    public int maxObservedConcurrency() {\n        return maxObserved.get();\n    }\n\n    public int availablePermits() {\n        return permits.availablePermits();\n    }\n}\n"
  },
  {
    "key": "course04-compound",
    "tab": "复合竞态",
    "filename": "CompoundActionLab.java",
    "path": "src/main/java/com/caesaemc/juc/course04/CompoundActionLab.java",
    "startLine": 1,
    "endLine": 53,
    "highlights": [
      9,
      19,
      20,
      23,
      24,
      25,
      26,
      34,
      35
    ],
    "note": "containsKey 与 put 之间存在可插入窗口；两个线程可以同时 miss 并重复执行加载。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/CompoundActionLab.java#L1-L53",
    "code": "package com.caesaemc.juc.course04;\n\nimport java.util.Map;\nimport java.util.concurrent.ConcurrentHashMap;\nimport java.util.concurrent.CountDownLatch;\nimport java.util.concurrent.atomic.AtomicInteger;\n\n/**\n * containsKey 和 put 各自安全，不代表它们组成的 check-then-act 是原子的。\n */\npublic final class CompoundActionLab {\n\n    private CompoundActionLab() {\n    }\n\n    public static Result reproduceDuplicateLoad() throws InterruptedException {\n        Map<String, String> cache = new ConcurrentHashMap<>();\n        AtomicInteger loads = new AtomicInteger();\n        CountDownLatch bothMissed = new CountDownLatch(2);\n        CountDownLatch allowLoad = new CountDownLatch(1);\n\n        Runnable brokenLoad = () -> {\n            if (!cache.containsKey(\"profile\")) {\n                bothMissed.countDown();\n                await(allowLoad);\n                cache.put(\"profile\", \"value-\" + loads.incrementAndGet());\n            }\n        };\n\n        Thread first = new Thread(brokenLoad, \"course04-loader-a\");\n        Thread second = new Thread(brokenLoad, \"course04-loader-b\");\n        first.start();\n        second.start();\n        bothMissed.await();\n        allowLoad.countDown();\n        first.join();\n        second.join();\n        return new Result(loads.get(), cache.get(\"profile\"));\n    }\n\n    private static void await(CountDownLatch latch) {\n        try {\n            latch.await();\n        } catch (InterruptedException exception) {\n            Thread.currentThread().interrupt();\n            throw new IllegalStateException(\"等待时被中断\", exception);\n        }\n    }\n\n    public record Result(int loadCount, String finalValue) {\n    }\n}\n"
  },
  {
    "key": "course04-cache",
    "tab": "原子缓存",
    "filename": "AtomicCache.java",
    "path": "src/main/java/com/caesaemc/juc/course04/AtomicCache.java",
    "startLine": 1,
    "endLine": 23,
    "highlights": [
      4,
      12,
      16
    ],
    "note": "把判断和建立交给 ConcurrentHashMap 的原子复合 API；映射函数仍应短小且无递归更新。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/AtomicCache.java#L1-L23",
    "code": "package com.caesaemc.juc.course04;\n\nimport java.util.Objects;\nimport java.util.concurrent.ConcurrentHashMap;\nimport java.util.function.Function;\n\n/**\n * 使用容器提供的复合原子 API，避免在多个公开方法之间留下竞态窗口。\n */\npublic final class AtomicCache<K, V> {\n\n    private final ConcurrentHashMap<K, V> values = new ConcurrentHashMap<>();\n\n    public V get(K key, Function<? super K, ? extends V> loader) {\n        Objects.requireNonNull(loader, \"loader\");\n        return values.computeIfAbsent(key, loader);\n    }\n\n    public int size() {\n        return values.size();\n    }\n}\n"
  },
  {
    "key": "course04-pipeline",
    "tab": "有界流水线",
    "filename": "BoundedPipeline.java",
    "path": "src/main/java/com/caesaemc/juc/course04/BoundedPipeline.java",
    "startLine": 1,
    "endLine": 46,
    "highlights": [
      5,
      20,
      26,
      27,
      39,
      41
    ],
    "note": "有界队列提供背压，END 是明确的停止协议；消费者不会永久卡在 take。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/BoundedPipeline.java#L1-L46",
    "code": "package com.caesaemc.juc.course04;\n\nimport java.util.ArrayList;\nimport java.util.List;\nimport java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.BlockingQueue;\n\n/**\n * 有界队列既传递数据，也把满载压力传回生产者；结束信号让消费者明确退出。\n */\npublic final class BoundedPipeline {\n\n    private static final String END = new String(\"END\");\n\n    private BoundedPipeline() {\n    }\n\n    public static List<String> run(List<String> input, int capacity)\n            throws InterruptedException {\n        BlockingQueue<String> queue = new ArrayBlockingQueue<>(capacity);\n        List<String> output = new ArrayList<>();\n\n        Thread consumer = new Thread(() -> {\n            try {\n                while (true) {\n                    String item = queue.take();\n                    if (item == END) {\n                        return;\n                    }\n                    output.add(item.toUpperCase());\n                }\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        }, \"course04-consumer\");\n\n        consumer.start();\n        for (String item : input) {\n            queue.put(item);\n        }\n        queue.put(END);\n        consumer.join();\n        return List.copyOf(output);\n    }\n}\n"
  },
  {
    "key": "course04-handoff",
    "tab": "直接移交",
    "filename": "QueueSemanticsLab.java",
    "path": "src/main/java/com/caesaemc/juc/course04/QueueSemanticsLab.java",
    "startLine": 1,
    "endLine": 28,
    "highlights": [
      3,
      6,
      14,
      17,
      23
    ],
    "note": "SynchronousQueue 不保存元素，一次 put 必须与一次 take 在运行时直接配对。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/QueueSemanticsLab.java#L1-L28",
    "code": "package com.caesaemc.juc.course04;\n\nimport java.util.concurrent.SynchronousQueue;\n\n/**\n * SynchronousQueue 容量为零：每次 put 都必须和某个 take 直接配对。\n */\npublic final class QueueSemanticsLab {\n\n    private QueueSemanticsLab() {\n    }\n\n    public static String handOff(String value) throws InterruptedException {\n        SynchronousQueue<String> handoff = new SynchronousQueue<>();\n        Thread producer = new Thread(() -> {\n            try {\n                handoff.put(value);\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        }, \"course04-producer\");\n        producer.start();\n        String received = handoff.take();\n        producer.join();\n        return received;\n    }\n}\n"
  },
  {
    "key": "course05-pool",
    "tab": "线程池决策",
    "filename": "ThreadPoolDecisionLab.java",
    "path": "src/main/java/com/caesaemc/juc/course05/ThreadPoolDecisionLab.java",
    "startLine": 1,
    "endLine": 61,
    "highlights": [
      5,
      18,
      24,
      38,
      39,
      40,
      45,
      47,
      50
    ],
    "note": "core=1、max=2、queue=1 的确定性实验依次走过核心、入队、扩容和拒绝。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/ThreadPoolDecisionLab.java#L1-L61",
    "code": "package com.caesaemc.juc.course05;\n\nimport java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.CountDownLatch;\nimport java.util.concurrent.RejectedExecutionException;\nimport java.util.concurrent.ThreadPoolExecutor;\nimport java.util.concurrent.TimeUnit;\n\n/**\n * 稳定走过 ThreadPoolExecutor 的核心线程、队列、非核心线程和拒绝四条路径。\n */\npublic final class ThreadPoolDecisionLab {\n\n    private ThreadPoolDecisionLab() {\n    }\n\n    public static Snapshot observe() throws InterruptedException {\n        ThreadPoolExecutor executor = new ThreadPoolExecutor(\n                1,\n                2,\n                30,\n                TimeUnit.SECONDS,\n                new ArrayBlockingQueue<>(1),\n                new ThreadPoolExecutor.AbortPolicy()\n        );\n        CountDownLatch twoWorkersStarted = new CountDownLatch(2);\n        CountDownLatch release = new CountDownLatch(1);\n        Runnable blockingTask = () -> {\n            twoWorkersStarted.countDown();\n            try {\n                release.await();\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        };\n\n        try {\n            executor.execute(blockingTask); // 1. 创建核心 Worker\n            executor.execute(blockingTask); // 2. 核心忙，任务进入队列\n            executor.execute(blockingTask); // 3. 队列满，创建非核心 Worker\n            twoWorkersStarted.await();\n\n            boolean rejected = false;\n            try {\n                executor.execute(() -> {\n                }); // 4. Worker 和队列都满，执行拒绝策略\n            } catch (RejectedExecutionException expected) {\n                rejected = true;\n            }\n            return new Snapshot(executor.getPoolSize(), executor.getQueue().size(), rejected);\n        } finally {\n            release.countDown();\n            executor.shutdown();\n            executor.awaitTermination(1, TimeUnit.SECONDS);\n        }\n    }\n\n    public record Snapshot(int poolSize, int queuedTasks, boolean rejected) {\n    }\n}\n"
  },
  {
    "key": "course05-deadline",
    "tab": "超时取消",
    "filename": "DeadlineRunner.java",
    "path": "src/main/java/com/caesaemc/juc/course05/DeadlineRunner.java",
    "startLine": 1,
    "endLine": 53,
    "highlights": [
      5,
      8,
      11,
      23,
      24,
      25,
      27
    ],
    "note": "等待超时后显式 cancel(true)；任务是否停止仍取决于任务代码是否协作响应中断。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/DeadlineRunner.java#L1-L53",
    "code": "package com.caesaemc.juc.course05;\n\nimport java.time.Duration;\nimport java.util.concurrent.Callable;\nimport java.util.concurrent.ExecutionException;\nimport java.util.concurrent.Executors;\nimport java.util.concurrent.TimeUnit;\nimport java.util.concurrent.TimeoutException;\n\n/**\n * TimeoutException 只表示调用方不再等待；cancel(true) 再把中断请求发给任务。\n */\npublic final class DeadlineRunner {\n\n    private DeadlineRunner() {\n    }\n\n    public static <T> Result<T> run(Callable<T> task, Duration timeout)\n            throws InterruptedException {\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            var future = executor.submit(task);\n            try {\n                return Result.success(future.get(timeout.toNanos(), TimeUnit.NANOSECONDS));\n            } catch (TimeoutException exception) {\n                future.cancel(true);\n                return Result.timeout();\n            } catch (ExecutionException exception) {\n                return Result.failed(exception.getCause());\n            }\n        }\n    }\n\n    public record Result<T>(Status status, T value, Throwable failure) {\n        public static <T> Result<T> success(T value) {\n            return new Result<>(Status.SUCCESS, value, null);\n        }\n\n        public static <T> Result<T> timeout() {\n            return new Result<>(Status.TIMEOUT, null, null);\n        }\n\n        public static <T> Result<T> failed(Throwable failure) {\n            return new Result<>(Status.FAILED, null, failure);\n        }\n    }\n\n    public enum Status {\n        SUCCESS,\n        TIMEOUT,\n        FAILED\n    }\n}\n"
  },
  {
    "key": "course05-aggregate",
    "tab": "异步聚合",
    "filename": "AsyncAggregator.java",
    "path": "src/main/java/com/caesaemc/juc/course05/AsyncAggregator.java",
    "startLine": 1,
    "endLine": 55,
    "highlights": [
      27,
      28,
      35,
      41
    ],
    "note": "每个调用先归一化为 Outcome，allOf 只协调完成，最后仍按输入 key 收集成功与失败。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/AsyncAggregator.java#L1-L55",
    "code": "package com.caesaemc.juc.course05;\n\nimport java.util.Collections;\nimport java.util.LinkedHashMap;\nimport java.util.List;\nimport java.util.Map;\nimport java.util.concurrent.CompletableFuture;\nimport java.util.concurrent.Executor;\nimport java.util.function.Supplier;\n\n/**\n * 独立调用并行发起，每个结果先归一化成 Outcome，再按输入顺序聚合。\n */\npublic final class AsyncAggregator {\n\n    private AsyncAggregator() {\n    }\n\n    public static <T> Map<String, Outcome<T>> aggregate(\n            Map<String, Supplier<T>> calls,\n            Executor executor\n    ) {\n        List<Map.Entry<String, CompletableFuture<Outcome<T>>>> futures = calls.entrySet()\n                .stream()\n                .map(entry -> Map.entry(\n                        entry.getKey(),\n                        CompletableFuture.supplyAsync(entry.getValue(), executor)\n                                .<Outcome<T>>handle((value, failure) ->\n                                        failure == null\n                                                ? Outcome.success(value)\n                                                : Outcome.failed(failure))\n                ))\n                .toList();\n\n        CompletableFuture.allOf(futures.stream()\n                .map(Map.Entry::getValue)\n                .toArray(CompletableFuture[]::new))\n                .join();\n\n        Map<String, Outcome<T>> result = new LinkedHashMap<>();\n        futures.forEach(entry -> result.put(entry.getKey(), entry.getValue().join()));\n        return Collections.unmodifiableMap(result);\n    }\n\n    public record Outcome<T>(boolean success, T value, Throwable failure) {\n        public static <T> Outcome<T> success(T value) {\n            return new Outcome<>(true, value, null);\n        }\n\n        public static <T> Outcome<T> failed(Throwable failure) {\n            return new Outcome<>(false, null, failure);\n        }\n    }\n}\n"
  },
  {
    "key": "course05-virtual",
    "tab": "虚拟线程",
    "filename": "VirtualThreadLab.java",
    "path": "src/main/java/com/caesaemc/juc/course05/VirtualThreadLab.java",
    "startLine": 1,
    "endLine": 54,
    "highlights": [
      21,
      25,
      30,
      38
    ],
    "note": "虚拟线程数量与下游资源容量分离；线程可以很多，真正同时占用资源的任务仍受许可限制。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/VirtualThreadLab.java#L1-L54",
    "code": "package com.caesaemc.juc.course05;\n\nimport java.time.Duration;\nimport java.util.ArrayList;\nimport java.util.List;\nimport java.util.concurrent.Executors;\nimport java.util.concurrent.Semaphore;\nimport java.util.concurrent.TimeUnit;\nimport java.util.concurrent.atomic.AtomicInteger;\n\n/**\n * 虚拟线程负责廉价承载阻塞任务，Semaphore 仍负责保护昂贵的外部资源。\n */\npublic final class VirtualThreadLab {\n\n    private VirtualThreadLab() {\n    }\n\n    public static Result run(int taskCount, int resourceCapacity, Duration work)\n            throws Exception {\n        Semaphore permits = new Semaphore(resourceCapacity);\n        AtomicInteger active = new AtomicInteger();\n        AtomicInteger maxObserved = new AtomicInteger();\n\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            var futures = new ArrayList<java.util.concurrent.Future<Integer>>();\n            for (int index = 0; index < taskCount; index++) {\n                int taskId = index;\n                futures.add(executor.submit(() -> {\n                    permits.acquire();\n                    int now = active.incrementAndGet();\n                    maxObserved.accumulateAndGet(now, Math::max);\n                    try {\n                        TimeUnit.NANOSECONDS.sleep(work.toNanos());\n                        return taskId;\n                    } finally {\n                        active.decrementAndGet();\n                        permits.release();\n                    }\n                }));\n            }\n\n            List<Integer> values = new ArrayList<>();\n            for (var future : futures) {\n                values.add(future.get());\n            }\n            return new Result(List.copyOf(values), maxObserved.get());\n        }\n    }\n\n    public record Result(List<Integer> values, int maxObservedConcurrency) {\n    }\n}\n"
  },
  {
    "key": "course06-deadline",
    "tab": "共享预算",
    "filename": "DeadlineBudget.java",
    "path": "src/main/java/com/caesaemc/juc/course06/DeadlineBudget.java",
    "startLine": 1,
    "endLine": 36,
    "highlights": [
      10,
      12,
      13,
      20,
      24,
      25,
      28,
      29,
      33
    ],
    "note": "入口只计算一次绝对 deadline，每一步都从单调时钟重新计算剩余预算。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/DeadlineBudget.java#L1-L36",
    "code": "package com.caesaemc.juc.course06;\n\nimport java.time.Duration;\n\n/**\n * 请求入口只计算一次绝对截止时间，所有步骤共享同一份剩余预算。\n */\npublic final class DeadlineBudget {\n\n    private final long deadlineNanos;\n\n    private DeadlineBudget(long deadlineNanos) {\n        this.deadlineNanos = deadlineNanos;\n    }\n\n    public static DeadlineBudget start(Duration timeout) {\n        if (timeout.isNegative() || timeout.isZero()) {\n            throw new IllegalArgumentException(\"timeout 必须大于 0\");\n        }\n        long now = System.nanoTime();\n        return new DeadlineBudget(Math.addExact(now, timeout.toNanos()));\n    }\n\n    public long remainingNanos() {\n        return Math.max(0, deadlineNanos - System.nanoTime());\n    }\n\n    public long remainingNanos(Duration stepLimit) {\n        return Math.min(remainingNanos(), stepLimit.toNanos());\n    }\n\n    public boolean expired() {\n        return remainingNanos() == 0;\n    }\n}\n"
  },
  {
    "key": "course06-harness",
    "tab": "并发测试",
    "filename": "ConcurrentTestHarness.java",
    "path": "src/main/java/com/caesaemc/juc/course06/ConcurrentTestHarness.java",
    "startLine": 1,
    "endLine": 67,
    "highlights": [
      27,
      28,
      41,
      42,
      45,
      57,
      63
    ],
    "note": "ready/start 两道门制造确定时序；超时或任一失败都会取消其余 actor。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/ConcurrentTestHarness.java#L1-L67",
    "code": "package com.caesaemc.juc.course06;\n\nimport java.time.Duration;\nimport java.util.ArrayList;\nimport java.util.List;\nimport java.util.concurrent.Callable;\nimport java.util.concurrent.CountDownLatch;\nimport java.util.concurrent.Executors;\nimport java.util.concurrent.Future;\nimport java.util.concurrent.TimeUnit;\nimport java.util.function.IntFunction;\n\n/**\n * ready/start 两道门建立可控时序；准备和结果收集共享同一个总 deadline。\n */\npublic final class ConcurrentTestHarness {\n\n    private ConcurrentTestHarness() {\n    }\n\n    public static <T> List<T> run(\n            int actors,\n            Duration timeout,\n            IntFunction<Callable<T>> actorFactory\n    ) throws Exception {\n        DeadlineBudget budget = DeadlineBudget.start(timeout);\n        CountDownLatch ready = new CountDownLatch(actors);\n        CountDownLatch start = new CountDownLatch(1);\n\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            List<Future<T>> futures = new ArrayList<>();\n            for (int index = 0; index < actors; index++) {\n                Callable<T> actor = actorFactory.apply(index);\n                futures.add(executor.submit(() -> {\n                    ready.countDown();\n                    start.await();\n                    return actor.call();\n                }));\n            }\n\n            if (!ready.await(budget.remainingNanos(), TimeUnit.NANOSECONDS)) {\n                cancelAll(futures);\n                throw new IllegalStateException(\"actor 未在预算内准备完成\");\n            }\n            start.countDown();\n\n            List<T> results = new ArrayList<>();\n            try {\n                for (Future<T> future : futures) {\n                    results.add(future.get(\n                            budget.remainingNanos(),\n                            TimeUnit.NANOSECONDS\n                    ));\n                }\n                return List.copyOf(results);\n            } catch (Exception failure) {\n                cancelAll(futures);\n                throw failure;\n            }\n        }\n    }\n\n    private static void cancelAll(List<? extends Future<?>> futures) {\n        futures.forEach(future -> future.cancel(true));\n    }\n}\n"
  },
  {
    "key": "course06-engine",
    "tab": "可靠聚合",
    "filename": "ReliableAggregator.java",
    "path": "src/main/java/com/caesaemc/juc/course06/ReliableAggregator.java",
    "startLine": 1,
    "endLine": 163,
    "highlights": [
      10,
      33,
      38,
      40,
      57,
      62,
      65,
      71,
      86
    ],
    "note": "请求共享总预算；提交、许可、执行、超时、取消、稳定终态和有序收集都写进一个协议。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/ReliableAggregator.java#L1-L163",
    "code": "package com.caesaemc.juc.course06;\n\nimport java.time.Duration;\nimport java.util.ArrayList;\nimport java.util.List;\nimport java.util.concurrent.Callable;\nimport java.util.concurrent.ExecutionException;\nimport java.util.concurrent.ExecutorService;\nimport java.util.concurrent.Future;\nimport java.util.concurrent.RejectedExecutionException;\nimport java.util.concurrent.Semaphore;\nimport java.util.concurrent.TimeUnit;\nimport java.util.concurrent.TimeoutException;\n\n/**\n * 有界多下游聚合：共享总 deadline、资源许可、稳定终态和按输入顺序收集。\n */\npublic final class ReliableAggregator implements AutoCloseable {\n\n    private final ExecutorService executor;\n    private final Semaphore resources;\n\n    public ReliableAggregator(ExecutorService executor, int resourceCapacity) {\n        if (resourceCapacity <= 0) {\n            throw new IllegalArgumentException(\"resourceCapacity 必须大于 0\");\n        }\n        this.executor = executor;\n        resources = new Semaphore(resourceCapacity);\n    }\n\n    public Response aggregate(List<DownstreamCall> calls, Duration requestTimeout)\n            throws InterruptedException {\n        DeadlineBudget budget = DeadlineBudget.start(requestTimeout);\n        List<PendingCall> pending = new ArrayList<>();\n\n        for (DownstreamCall call : calls) {\n            try {\n                Future<String> future = executor.submit(() -> invoke(call, budget));\n                pending.add(new PendingCall(call, future, null));\n            } catch (RejectedExecutionException rejection) {\n                pending.add(new PendingCall(\n                        call,\n                        null,\n                        new Outcome(call.name(), call.critical(), Status.REJECTED, null, rejection)\n                ));\n            }\n        }\n\n        List<Outcome> outcomes = new ArrayList<>();\n        for (PendingCall item : pending) {\n            if (item.immediate() != null) {\n                outcomes.add(item.immediate());\n                continue;\n            }\n            long waitNanos = budget.remainingNanos(item.call().timeout());\n            if (waitNanos == 0) {\n                item.future().cancel(true);\n                outcomes.add(Outcome.timeout(item.call()));\n                continue;\n            }\n            try {\n                String value = item.future().get(waitNanos, TimeUnit.NANOSECONDS);\n                outcomes.add(Outcome.success(item.call(), value));\n            } catch (TimeoutException exception) {\n                item.future().cancel(true);\n                outcomes.add(Outcome.timeout(item.call()));\n            } catch (ExecutionException exception) {\n                outcomes.add(Outcome.failed(item.call(), exception.getCause()));\n            }\n        }\n        return new Response(overallStatus(outcomes), List.copyOf(outcomes));\n    }\n\n    private String invoke(DownstreamCall call, DeadlineBudget budget) throws Exception {\n        long waitNanos = budget.remainingNanos(call.timeout());\n        if (waitNanos == 0 || !resources.tryAcquire(waitNanos, TimeUnit.NANOSECONDS)) {\n            throw new ResourceTimeoutException();\n        }\n        try {\n            return call.action().call();\n        } finally {\n            resources.release();\n        }\n    }\n\n    private static OverallStatus overallStatus(List<Outcome> outcomes) {\n        boolean criticalFailure = outcomes.stream()\n                .anyMatch(outcome -> outcome.critical() && outcome.status() != Status.SUCCESS);\n        if (criticalFailure) {\n            return OverallStatus.FAILED;\n        }\n        boolean partial = outcomes.stream()\n                .anyMatch(outcome -> outcome.status() != Status.SUCCESS);\n        return partial ? OverallStatus.PARTIAL : OverallStatus.OK;\n    }\n\n    @Override\n    public void close() throws InterruptedException {\n        executor.shutdown();\n        if (!executor.awaitTermination(1, TimeUnit.SECONDS)) {\n            executor.shutdownNow();\n            executor.awaitTermination(1, TimeUnit.SECONDS);\n        }\n    }\n\n    public record DownstreamCall(\n            String name,\n            boolean critical,\n            Duration timeout,\n            Callable<String> action\n    ) {\n    }\n\n    public record Outcome(\n            String name,\n            boolean critical,\n            Status status,\n            String value,\n            Throwable failure\n    ) {\n        private static Outcome success(DownstreamCall call, String value) {\n            return new Outcome(call.name(), call.critical(), Status.SUCCESS, value, null);\n        }\n\n        private static Outcome timeout(DownstreamCall call) {\n            return new Outcome(call.name(), call.critical(), Status.TIMEOUT, null, null);\n        }\n\n        private static Outcome failed(DownstreamCall call, Throwable failure) {\n            Status status = failure instanceof ResourceTimeoutException\n                    ? Status.TIMEOUT\n                    : Status.FAILED;\n            return new Outcome(call.name(), call.critical(), status, null, failure);\n        }\n    }\n\n    public record Response(OverallStatus status, List<Outcome> outcomes) {\n    }\n\n    private record PendingCall(\n            DownstreamCall call,\n            Future<String> future,\n            Outcome immediate\n    ) {\n    }\n\n    public enum Status {\n        SUCCESS,\n        TIMEOUT,\n        REJECTED,\n        FAILED\n    }\n\n    public enum OverallStatus {\n        OK,\n        PARTIAL,\n        FAILED\n    }\n\n    private static final class ResourceTimeoutException extends TimeoutException {\n    }\n}\n"
  },
  {
    "key": "course06-strategy",
    "tab": "执行策略",
    "filename": "AggregationStrategies.java",
    "path": "src/main/java/com/caesaemc/juc/course06/AggregationStrategies.java",
    "startLine": 1,
    "endLine": 39,
    "highlights": [
      3,
      19,
      21,
      26,
      27,
      29,
      32,
      34,
      35
    ],
    "note": "平台线程池与虚拟线程只是执行载体；两种方案都继续用 resourceCapacity 保护真实下游。",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/AggregationStrategies.java#L1-L39",
    "code": "package com.caesaemc.juc.course06;\n\nimport java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.Executors;\nimport java.util.concurrent.ThreadPoolExecutor;\nimport java.util.concurrent.TimeUnit;\n\n/**\n * 执行载体可以替换，但两种策略都必须继续限制真实资源容量。\n */\npublic final class AggregationStrategies {\n\n    private AggregationStrategies() {\n    }\n\n    public static ReliableAggregator platform(\n            int workers,\n            int queueCapacity,\n            int resourceCapacity\n    ) {\n        ThreadPoolExecutor executor = new ThreadPoolExecutor(\n                workers,\n                workers,\n                0,\n                TimeUnit.MILLISECONDS,\n                new ArrayBlockingQueue<>(queueCapacity),\n                new ThreadPoolExecutor.AbortPolicy()\n        );\n        return new ReliableAggregator(executor, resourceCapacity);\n    }\n\n    public static ReliableAggregator virtual(int resourceCapacity) {\n        return new ReliableAggregator(\n                Executors.newVirtualThreadPerTaskExecutor(),\n                resourceCapacity\n        );\n    }\n}\n"
  }
] as const satisfies readonly SourceSnippet[];

export const sourceSnippetByKey = Object.fromEntries(
  sourceSnippets.map((source) => [source.key, source]),
) as Record<string, SourceSnippet>;
