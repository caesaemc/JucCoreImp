// 由 scripts/generate-course-sources.mjs 从真实 Java 源码生成。
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

export const sourceSnippets = [
  {
    "key": "02-publication",
    "tab": "不可变快照",
    "path": "src/main/java/com/caesaemc/juc/lesson02/SafePublicationDemo.java",
    "startLine": 67,
    "endLine": 80,
    "highlights": [
      68,
      74,
      75,
      78,
      79
    ],
    "note": "完整构造 Settings 后，只通过一次 volatile 引用替换发布；读者拿到旧快照或新快照，不会拿到混合字段。",
    "filename": "SafePublicationDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson02/SafePublicationDemo.java#L67-L80",
    "code": "    public static final class ConfigRepository {\n        private volatile Settings current;\n\n        public ConfigRepository(Settings initial) {\n            this.current = initial;\n        }\n\n        public Settings snapshot() {\n            return current;\n        }\n\n        public void update(Settings settings) {\n            current = settings;\n        }"
  },
  {
    "key": "02-dcl",
    "tab": "DCL 单例",
    "path": "src/main/java/com/caesaemc/juc/lesson02/DclSingleton.java",
    "startLine": 8,
    "endLine": 27,
    "highlights": [
      8,
      17,
      18,
      19,
      20,
      21,
      22,
      23
    ],
    "note": "第一次读取避开常规加锁，第二次检查防止重复构造；volatile 负责安全发布并约束重排序。",
    "filename": "DclSingleton.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson02/DclSingleton.java#L8-L27",
    "code": "    private static volatile DclSingleton instance;\n\n    private final long createdAtNanos;\n\n    private DclSingleton() {\n        createdAtNanos = System.nanoTime();\n    }\n\n    public static DclSingleton instance() {\n        DclSingleton local = instance;\n        if (local == null) {\n            synchronized (DclSingleton.class) {\n                local = instance;\n                if (local == null) {\n                    local = new DclSingleton();\n                    instance = local;\n                }\n            }\n        }\n        return local;"
  },
  {
    "key": "02-exercise",
    "tab": "序号练习",
    "path": "src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java",
    "startLine": 8,
    "endLine": 17,
    "highlights": [
      8,
      10,
      11,
      12,
      15,
      16
    ],
    "note": "volatile 只能让新值可见，不能把 ++ 合成原子动作；练习要求 next 与 current 使用同一监视器。",
    "filename": "SequenceExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson02/SequenceExercise.java#L8-L17",
    "code": "    private volatile int sequence;\n\n    public int next() {\n        // TODO：volatile 不能保证 ++ 的原子性，请修复。\n        return ++sequence;\n    }\n\n    public int current() {\n        return sequence;\n    }"
  },
  {
    "key": "03-termination",
    "tab": "两阶段终止",
    "path": "src/main/java/com/caesaemc/juc/lesson03/TwoPhaseTerminator.java",
    "startLine": 39,
    "endLine": 65,
    "highlights": [
      42,
      44,
      46,
      48,
      51,
      52,
      61,
      62
    ],
    "note": "interrupt 只是停止请求；工作线程恢复中断、离开循环，并在 finally 中完成终态通知，调用者再 join 验收。",
    "filename": "TwoPhaseTerminator.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson03/TwoPhaseTerminator.java#L39-L65",
    "code": "    private void runLoop() {\n        running.countDown();\n        try {\n            while (!Thread.currentThread().isInterrupted()) {\n                try {\n                    TimeUnit.MILLISECONDS.sleep(10);\n                    cycles.incrementAndGet();\n                } catch (InterruptedException exception) {\n                    // sleep 会清除中断标志，恢复它让循环条件观察到停止请求。\n                    Thread.currentThread().interrupt();\n                }\n            }\n        } finally {\n            stopped.countDown();\n        }\n    }\n\n    @Override\n    public void close() throws InterruptedException {\n        if (!started.get()) {\n            return;\n        }\n        worker.interrupt();\n        worker.join(Duration.ofSeconds(2).toMillis());\n        if (worker.isAlive()) {\n            throw new IllegalStateException(\"工作线程未能按时停止\");\n        }"
  },
  {
    "key": "03-mailbox",
    "tab": "保护性暂停",
    "path": "src/main/java/com/caesaemc/juc/lesson03/GuardedMailbox.java",
    "startLine": 13,
    "endLine": 33,
    "highlights": [
      15,
      17,
      20,
      21,
      26,
      30,
      31,
      32
    ],
    "note": "等待线程共享一个绝对截止时间，每次唤醒重算剩余预算；条件写入和 notifyAll 受同一监视器保护。",
    "filename": "GuardedMailbox.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson03/GuardedMailbox.java#L13-L33",
    "code": "    public synchronized T await(Duration timeout) throws InterruptedException {\n        long remainingNanos = timeout.toNanos();\n        long deadline = System.nanoTime() + remainingNanos;\n\n        while (!completed && remainingNanos > 0) {\n            long millis = remainingNanos / 1_000_000L;\n            int nanos = (int) (remainingNanos % 1_000_000L);\n            wait(millis, nanos);\n            remainingNanos = deadline - System.nanoTime();\n        }\n        return completed ? value : null;\n    }\n\n    public synchronized boolean complete(T result) {\n        if (completed) {\n            return false;\n        }\n        value = result;\n        completed = true;\n        notifyAll();\n        return true;"
  },
  {
    "key": "03-exercise",
    "tab": "取消练习",
    "path": "src/main/java/com/caesaemc/juc/lesson03/CancellationExercise.java",
    "startLine": 13,
    "endLine": 22,
    "highlights": [
      15,
      17,
      19,
      20
    ],
    "note": "InterruptedException 会清除中断标志；空 catch 会吞掉取消协议，必须恢复中断并退出循环。",
    "filename": "CancellationExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson03/CancellationExercise.java#L13-L22",
    "code": "    @Override\n    public void run() {\n        while (true) {\n            try {\n                TimeUnit.MILLISECONDS.sleep(20);\n                completedUnits.incrementAndGet();\n            } catch (InterruptedException ignored) {\n                // TODO：不能吞掉中断。恢复中断状态并退出循环。\n            }\n        }"
  },
  {
    "key": "04-cas",
    "tab": "CAS 循环",
    "path": "src/main/java/com/caesaemc/juc/lesson04/VarHandleCounter.java",
    "startLine": 24,
    "endLine": 37,
    "highlights": [
      25,
      28,
      29,
      30,
      31,
      32,
      36,
      37
    ],
    "note": "每次失败都重新读取 observed 并计算 next；成功的 compareAndSet 是这次递增的线性化点。",
    "filename": "VarHandleCounter.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson04/VarHandleCounter.java#L24-L37",
    "code": "    @SuppressWarnings(\"FieldMayBeFinal\")\n    private volatile int value;\n\n    @Override\n    public void increment() {\n        int observed;\n        do {\n            observed = (int) VALUE.getVolatile(this);\n        } while (!VALUE.compareAndSet(this, observed, observed + 1));\n    }\n\n    @Override\n    public int value() {\n        return (int) VALUE.getVolatile(this);"
  },
  {
    "key": "04-aba",
    "tab": "ABA 时间线",
    "path": "src/main/java/com/caesaemc/juc/lesson04/AbaDemo.java",
    "startLine": 14,
    "endLine": 30,
    "highlights": [
      16,
      17,
      18,
      19,
      23,
      24,
      25,
      26,
      27,
      28
    ],
    "note": "普通引用只看到最终仍为 A；带戳引用同时比较版本，能发现 A→B→A 的中间历史。",
    "filename": "AbaDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson04/AbaDemo.java#L14-L30",
    "code": "    public static AbaResult demonstrate() {\n        AtomicReference<String> plain = new AtomicReference<>(\"A\");\n        String plainObserved = plain.get();\n        plain.compareAndSet(\"A\", \"B\");\n        plain.compareAndSet(\"B\", \"A\");\n        boolean plainAccepted = plain.compareAndSet(plainObserved, \"C\");\n\n        AtomicStampedReference<String> stamped = new AtomicStampedReference<>(\"A\", 0);\n        int[] stampHolder = new int[1];\n        String stampedObserved = stamped.get(stampHolder);\n        int originalStamp = stampHolder[0];\n        stamped.compareAndSet(\"A\", \"B\", 0, 1);\n        stamped.compareAndSet(\"B\", \"A\", 1, 2);\n        boolean stampedAccepted =\n                stamped.compareAndSet(stampedObserved, \"C\", originalStamp, originalStamp + 1);\n\n        return new AbaResult(plainAccepted, stampedAccepted, stamped.getStamp());"
  },
  {
    "key": "04-exercise",
    "tab": "余额练习",
    "path": "src/main/java/com/caesaemc/juc/lesson04/BoundedBalanceExercise.java",
    "startLine": 10,
    "endLine": 27,
    "highlights": [
      10,
      16,
      17,
      18,
      21
    ],
    "note": "余额检查和扣减必须放进同一 CAS 重试循环；分离的 get/set 会在并发下突破余额不为负的不变量。",
    "filename": "BoundedBalanceExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson04/BoundedBalanceExercise.java#L10-L27",
    "code": "    private final AtomicInteger balance;\n\n    public BoundedBalanceExercise(int initialBalance) {\n        balance = new AtomicInteger(initialBalance);\n    }\n\n    public boolean withdraw(int amount) {\n        // TODO：把 check-then-act 改成 CAS 循环。\n        if (balance.get() < amount) {\n            return false;\n        }\n        balance.set(balance.get() - amount);\n        return true;\n    }\n\n    public int balance() {\n        return balance.get();\n    }"
  },
  {
    "key": "05-mutex",
    "tab": "AQS 互斥锁",
    "path": "src/main/java/com/caesaemc/juc/lesson05/Mutex.java",
    "startLine": 53,
    "endLine": 80,
    "highlights": [
      56,
      57,
      58,
      65,
      66,
      69,
      70,
      75,
      79,
      80
    ],
    "note": "子类只定义 state 成功/释放规则；AQS 负责失败线程的入队、park、唤醒、中断和取消。",
    "filename": "Mutex.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson05/Mutex.java#L53-L80",
    "code": "    private static final class Sync extends AbstractQueuedSynchronizer {\n\n        @Override\n        protected boolean tryAcquire(int ignored) {\n            if (compareAndSetState(0, 1)) {\n                setExclusiveOwnerThread(Thread.currentThread());\n                return true;\n            }\n            return false;\n        }\n\n        @Override\n        protected boolean tryRelease(int ignored) {\n            if (getState() == 0 || getExclusiveOwnerThread() != Thread.currentThread()) {\n                throw new IllegalMonitorStateException(\"当前线程不是锁持有者\");\n            }\n            setExclusiveOwnerThread(null);\n            setState(0);\n            return true;\n        }\n\n        @Override\n        protected boolean isHeldExclusively() {\n            return getState() == 1 && getExclusiveOwnerThread() == Thread.currentThread();\n        }\n\n        private Condition newCondition() {\n            return new ConditionObject();"
  },
  {
    "key": "05-condition",
    "tab": "双条件队列",
    "path": "src/main/java/com/caesaemc/juc/lesson05/BoundedBuffer.java",
    "startLine": 30,
    "endLine": 60,
    "highlights": [
      31,
      33,
      34,
      38,
      39,
      41,
      47,
      49,
      50,
      55,
      56,
      59
    ],
    "note": "notFull 与 notEmpty 分离等待者；await 释放锁，signal 后节点仍需转移到同步队列重新竞争。",
    "filename": "BoundedBuffer.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson05/BoundedBuffer.java#L30-L60",
    "code": "    public void put(E element) throws InterruptedException {\n        lock.lockInterruptibly();\n        try {\n            while (count == elements.length) {\n                notFull.await();\n            }\n            elements[putIndex] = element;\n            putIndex = (putIndex + 1) % elements.length;\n            count++;\n            notEmpty.signal();\n        } finally {\n            lock.unlock();\n        }\n    }\n\n    @SuppressWarnings(\"unchecked\")\n    public E take() throws InterruptedException {\n        lock.lockInterruptibly();\n        try {\n            while (count == 0) {\n                notEmpty.await();\n            }\n            E element = (E) elements[takeIndex];\n            elements[takeIndex] = null;\n            takeIndex = (takeIndex + 1) % elements.length;\n            count--;\n            notFull.signal();\n            return element;\n        } finally {\n            lock.unlock();\n        }"
  },
  {
    "key": "05-exercise",
    "tab": "共享模式练习",
    "path": "src/main/java/com/caesaemc/juc/lesson05/OneShotLatchExercise.java",
    "startLine": 12,
    "endLine": 35,
    "highlights": [
      12,
      13,
      16,
      17,
      27,
      28,
      32,
      33,
      34
    ],
    "note": "打开前共享获取失败并排队；state 变为 1 后释放传播唤醒，现有与未来调用者都可直接通过。",
    "filename": "OneShotLatchExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson05/OneShotLatchExercise.java#L12-L35",
    "code": "    public void await() throws InterruptedException {\n        // TODO：使用共享模式可中断获取。\n    }\n\n    public void open() {\n        // TODO：释放共享状态并传播唤醒。\n    }\n\n    public boolean isOpen() {\n        return sync.getStateValue() == 1;\n    }\n\n    private static final class Sync extends AbstractQueuedSynchronizer {\n\n        @Override\n        protected int tryAcquireShared(int ignored) {\n            return getState() == 1 ? 1 : -1;\n        }\n\n        @Override\n        protected boolean tryReleaseShared(int ignored) {\n            setState(1);\n            return true;\n        }"
  },
  {
    "key": "06-semaphore",
    "tab": "资源闸门",
    "path": "src/main/java/com/caesaemc/juc/lesson06/ResourceGate.java",
    "startLine": 24,
    "endLine": 34,
    "highlights": [
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33
    ],
    "note": "许可代表真实稀缺资源；只有 acquire 成功后才进入 try/finally，异常路径也不会泄漏容量。",
    "filename": "ResourceGate.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson06/ResourceGate.java#L24-L34",
    "code": "    public <T> T call(Callable<T> action) throws Exception {\n        Objects.requireNonNull(action, \"action\");\n        permits.acquire();\n        int now = active.incrementAndGet();\n        maxObserved.accumulateAndGet(now, Math::max);\n        try {\n            return action.call();\n        } finally {\n            active.decrementAndGet();\n            permits.release();\n        }"
  },
  {
    "key": "06-stamped",
    "tab": "乐观读取",
    "path": "src/main/java/com/caesaemc/juc/lesson06/StampedPoint.java",
    "startLine": 14,
    "endLine": 37,
    "highlights": [
      15,
      20,
      25,
      26,
      27,
      28,
      29,
      31,
      32,
      34
    ],
    "note": "乐观读先复制普通字段到局部变量，再 validate；验证失败必须持读锁重新复制，不能继续使用旧快照。",
    "filename": "StampedPoint.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson06/StampedPoint.java#L14-L37",
    "code": "    public void move(double deltaX, double deltaY) {\n        long stamp = lock.writeLock();\n        try {\n            x += deltaX;\n            y += deltaY;\n        } finally {\n            lock.unlockWrite(stamp);\n        }\n    }\n\n    public double distanceFromOrigin() {\n        long stamp = lock.tryOptimisticRead();\n        double currentX = x;\n        double currentY = y;\n        if (!lock.validate(stamp)) {\n            stamp = lock.readLock();\n            try {\n                currentX = x;\n                currentY = y;\n            } finally {\n                lock.unlockRead(stamp);\n            }\n        }\n        return Math.hypot(currentX, currentY);"
  },
  {
    "key": "06-exercise",
    "tab": "许可练习",
    "path": "src/main/java/com/caesaemc/juc/lesson06/PermitGuardExercise.java",
    "startLine": 17,
    "endLine": 22,
    "highlights": [
      18,
      19,
      20,
      21
    ],
    "note": "当前实现遇到 action 异常就跳过 release；练习要求用 finally 覆盖正常、受检异常和运行时异常。",
    "filename": "PermitGuardExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson06/PermitGuardExercise.java#L17-L22",
    "code": "    public <T> T call(Callable<T> action) throws Exception {\n        semaphore.acquire();\n        // TODO：使用 try/finally，异常时也必须归还许可。\n        T value = action.call();\n        semaphore.release();\n        return value;"
  },
  {
    "key": "07-compound",
    "tab": "复合竞态",
    "path": "src/main/java/com/caesaemc/juc/lesson07/CompoundActionDemo.java",
    "startLine": 15,
    "endLine": 65,
    "highlights": [
      22,
      23,
      24,
      26,
      27,
      40,
      43,
      51,
      52,
      53,
      65
    ],
    "note": "containsKey 与 put 各自安全但组合不原子；computeIfAbsent 把同 key 的判断和建立合并到容器协议中。",
    "filename": "CompoundActionDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson07/CompoundActionDemo.java#L15-L65",
    "code": "    public static Result brokenCheckThenAct() throws InterruptedException {\n        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();\n        CountDownLatch bothChecked = new CountDownLatch(2);\n        CountDownLatch allowPut = new CountDownLatch(1);\n        AtomicInteger creators = new AtomicInteger();\n\n        Runnable task = () -> {\n            if (!map.containsKey(\"key\")) {\n                creators.incrementAndGet();\n                bothChecked.countDown();\n                try {\n                    allowPut.await();\n                    map.put(\"key\", Thread.currentThread().getName());\n                } catch (InterruptedException exception) {\n                    Thread.currentThread().interrupt();\n                }\n            }\n        };\n\n        Thread first = Thread.ofPlatform().name(\"creator-1\").start(task);\n        Thread second = Thread.ofPlatform().name(\"creator-2\").start(task);\n        bothChecked.await();\n        allowPut.countDown();\n        first.join();\n        second.join();\n        return new Result(creators.get(), map.size());\n    }\n\n    public static Result atomicCompute() throws InterruptedException {\n        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();\n        AtomicInteger creators = new AtomicInteger();\n        CountDownLatch start = new CountDownLatch(1);\n\n        Runnable task = () -> {\n            try {\n                start.await();\n                map.computeIfAbsent(\"key\", key -> {\n                    creators.incrementAndGet();\n                    return Thread.currentThread().getName();\n                });\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        };\n\n        Thread first = Thread.ofPlatform().name(\"compute-1\").start(task);\n        Thread second = Thread.ofPlatform().name(\"compute-2\").start(task);\n        start.countDown();\n        first.join();\n        second.join();\n        return new Result(creators.get(), map.size());"
  },
  {
    "key": "07-cache",
    "tab": "原子缓存",
    "path": "src/main/java/com/caesaemc/juc/lesson07/ConcurrentCache.java",
    "startLine": 10,
    "endLine": 29,
    "highlights": [
      12,
      13,
      19,
      20,
      23,
      24
    ],
    "note": "映射函数应短小、无递归更新；远程慢加载需要进一步使用 Future 单飞、超时和失败清除。",
    "filename": "ConcurrentCache.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson07/ConcurrentCache.java#L10-L29",
    "code": "public final class ConcurrentCache<K, V> {\n\n    private final ConcurrentHashMap<K, V> values = new ConcurrentHashMap<>();\n    private final Function<K, V> loader;\n\n    public ConcurrentCache(Function<K, V> loader) {\n        this.loader = Objects.requireNonNull(loader, \"loader\");\n    }\n\n    public V get(K key) {\n        return values.computeIfAbsent(key, loader);\n    }\n\n    public void invalidate(K key) {\n        values.remove(key);\n    }\n\n    public int estimatedSize() {\n        return values.size();\n    }"
  },
  {
    "key": "07-exercise",
    "tab": "缓存练习",
    "path": "src/main/java/com/caesaemc/juc/lesson07/CacheExercise.java",
    "startLine": 14,
    "endLine": 26,
    "highlights": [
      15,
      16,
      17,
      18,
      19,
      24,
      25
    ],
    "note": "两个线程可以同时看到 null 并各自执行 load；练习目标是让同 key 的加载成为一个原子复合操作。",
    "filename": "CacheExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson07/CacheExercise.java#L14-L26",
    "code": "    public String get(String key) {\n        String value = values.get(key);\n        if (value == null) {\n            // TODO：改用 computeIfAbsent，并保证 loader 不递归修改同一个 key。\n            value = load(key);\n            values.put(key, value);\n        }\n        return value;\n    }\n\n    private String load(String key) {\n        loadCount.incrementAndGet();\n        return \"value-\" + key;"
  },
  {
    "key": "08-pipeline",
    "tab": "有界流水线",
    "path": "src/main/java/com/caesaemc/juc/lesson08/BoundedPipeline.java",
    "startLine": 18,
    "endLine": 52,
    "highlights": [
      23,
      30,
      31,
      32,
      35,
      40,
      45,
      46,
      48,
      49,
      51
    ],
    "note": "ArrayBlockingQueue 同时传递数据和表达容量；put 在满载时把压力传回生产者，poison pill 明确结束消费者。",
    "filename": "BoundedPipeline.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson08/BoundedPipeline.java#L18-L52",
    "code": "    public static List<Integer> square(\n            List<Integer> inputs,\n            int capacity,\n            int consumerCount\n    ) throws InterruptedException {\n        BlockingQueue<Message> queue = new ArrayBlockingQueue<>(capacity);\n        List<Integer> outputs = Collections.synchronizedList(new ArrayList<>());\n        CountDownLatch consumersDone = new CountDownLatch(consumerCount);\n\n        for (int index = 0; index < consumerCount; index++) {\n            Thread.ofPlatform().name(\"pipeline-consumer-\" + index).start(() -> {\n                try {\n                    while (true) {\n                        Message message = queue.take();\n                        if (message.poison()) {\n                            return;\n                        }\n                        outputs.add(message.value() * message.value());\n                    }\n                } catch (InterruptedException exception) {\n                    Thread.currentThread().interrupt();\n                } finally {\n                    consumersDone.countDown();\n                }\n            });\n        }\n\n        for (Integer input : inputs) {\n            queue.put(new Message(input, false));\n        }\n        for (int index = 0; index < consumerCount; index++) {\n            queue.put(new Message(0, true));\n        }\n        consumersDone.await();\n        return List.copyOf(outputs);"
  },
  {
    "key": "08-handoff",
    "tab": "直接移交",
    "path": "src/main/java/com/caesaemc/juc/lesson08/QueueSemanticsDemo.java",
    "startLine": 16,
    "endLine": 27,
    "highlights": [
      17,
      18,
      20,
      25,
      26
    ],
    "note": "SynchronousQueue 容量为零，生产者的 put 必须与消费者的 take 配对，不在队列中存储元素。",
    "filename": "QueueSemanticsDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson08/QueueSemanticsDemo.java#L16-L27",
    "code": "    public static String directHandoff(String value) throws InterruptedException {\n        SynchronousQueue<String> queue = new SynchronousQueue<>();\n        Thread producer = Thread.ofPlatform().start(() -> {\n            try {\n                queue.put(value);\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        });\n        String received = queue.take();\n        producer.join();\n        return received;"
  },
  {
    "key": "08-exercise",
    "tab": "批处理练习",
    "path": "src/main/java/com/caesaemc/juc/lesson08/BatchingQueueExercise.java",
    "startLine": 12,
    "endLine": 21,
    "highlights": [
      12,
      18,
      19,
      20
    ],
    "note": "先 take 阻塞取得第一个元素，再 drainTo 非阻塞补满批次，既不空转也不等待凑齐整个批次。",
    "filename": "BatchingQueueExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson08/BatchingQueueExercise.java#L12-L21",
    "code": "    private final BlockingQueue<T> queue;\n\n    public BatchingQueueExercise(BlockingQueue<T> queue) {\n        this.queue = queue;\n    }\n\n    public List<T> takeBatch(int maxBatchSize) throws InterruptedException {\n        // TODO：校验 maxBatchSize，take 一个，再 drainTo 最多 maxBatchSize - 1 个。\n        return new ArrayList<>();\n    }"
  },
  {
    "key": "09-decision",
    "tab": "execute 决策",
    "path": "src/main/java/com/caesaemc/juc/lesson09/ThreadPoolDecisionModel.java",
    "startLine": 11,
    "endLine": 30,
    "highlights": [
      18,
      21,
      22,
      24,
      25,
      27,
      28,
      30
    ],
    "note": "提交路径依次尝试核心 Worker、队列、非核心 Worker，最后拒绝；队列策略决定 max 是否真正参与。",
    "filename": "ThreadPoolDecisionModel.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson09/ThreadPoolDecisionModel.java#L11-L30",
    "code": "    public static Decision decide(\n            boolean running,\n            int workers,\n            int corePoolSize,\n            int maximumPoolSize,\n            boolean queueOfferSucceeds\n    ) {\n        if (!running) {\n            return Decision.REJECT;\n        }\n        if (workers < corePoolSize) {\n            return Decision.START_CORE_WORKER;\n        }\n        if (queueOfferSucceeds) {\n            return Decision.ENQUEUE;\n        }\n        if (workers < maximumPoolSize) {\n            return Decision.START_NON_CORE_WORKER;\n        }\n        return Decision.REJECT;"
  },
  {
    "key": "09-saturation",
    "tab": "饱和实验",
    "path": "src/main/java/com/caesaemc/juc/lesson09/PoolSaturationDemo.java",
    "startLine": 15,
    "endLine": 50,
    "highlights": [
      16,
      17,
      18,
      30,
      31,
      32,
      37,
      40,
      41,
      44,
      45
    ],
    "note": "core=1、max=2、queue=1 时，前三个阻塞任务走完三条接收路径，第四个得到明确拒绝信号。",
    "filename": "PoolSaturationDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson09/PoolSaturationDemo.java#L15-L50",
    "code": "    public static Result run() throws InterruptedException {\n        InstrumentedThreadPool pool = new InstrumentedThreadPool(1, 2, 1, \"saturation\");\n        CountDownLatch twoRunning = new CountDownLatch(2);\n        CountDownLatch release = new CountDownLatch(1);\n        Runnable blocker = () -> {\n            twoRunning.countDown();\n            try {\n                release.await();\n            } catch (InterruptedException exception) {\n                Thread.currentThread().interrupt();\n            }\n        };\n\n        boolean fourthRejected;\n        try {\n            pool.execute(blocker);\n            pool.execute(blocker);\n            pool.execute(blocker);\n            if (!twoRunning.await(5, TimeUnit.SECONDS)) {\n                throw new IllegalStateException(\"两个工作线程未启动\");\n            }\n            try {\n                pool.execute(() -> {\n                });\n                fourthRejected = false;\n            } catch (RejectedExecutionException expected) {\n                fourthRejected = true;\n            }\n        } finally {\n            release.countDown();\n            pool.shutdown();\n            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {\n                pool.shutdownNow();\n            }\n        }\n        return new Result(fourthRejected, pool.metrics());"
  },
  {
    "key": "09-exercise",
    "tab": "配置练习",
    "path": "src/main/java/com/caesaemc/juc/lesson09/PoolConfigExercise.java",
    "startLine": 9,
    "endLine": 17,
    "highlights": [
      14,
      15,
      16
    ],
    "note": "便捷工厂隐藏无界队列和拒绝语义；练习要求显式构造容量、线程名称与拒绝策略。",
    "filename": "PoolConfigExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson09/PoolConfigExercise.java#L9-L17",
    "code": "public final class PoolConfigExercise {\n\n    private PoolConfigExercise() {\n    }\n\n    public static ExecutorService create() {\n        // TODO：不要使用无界队列的便捷工厂。\n        return Executors.newFixedThreadPool(4);\n    }"
  },
  {
    "key": "10-deadline",
    "tab": "超时取消",
    "path": "src/main/java/com/caesaemc/juc/lesson10/DeadlineTaskRunner.java",
    "startLine": 22,
    "endLine": 35,
    "highlights": [
      24,
      27,
      29,
      30,
      31,
      32,
      33
    ],
    "note": "TimeoutException 只说明调用者不再等待；cancel(true) 发出中断请求，任务是否真正停止取决于执行层协作。",
    "filename": "DeadlineTaskRunner.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson10/DeadlineTaskRunner.java#L22-L35",
    "code": "    public <T> TaskResult<T> call(Callable<T> task, Duration timeout)\n            throws InterruptedException {\n        Future<T> future = executor.submit(task);\n        try {\n            return TaskResult.success(\n                    future.get(timeout.toNanos(), TimeUnit.NANOSECONDS)\n            );\n        } catch (TimeoutException exception) {\n            boolean cancellationRequested = future.cancel(true);\n            return TaskResult.timedOut(cancellationRequested);\n        } catch (ExecutionException exception) {\n            return TaskResult.failure(exception.getCause());\n        }\n    }"
  },
  {
    "key": "10-shutdown",
    "tab": "优雅关闭",
    "path": "src/main/java/com/caesaemc/juc/lesson10/GracefulExecutor.java",
    "startLine": 16,
    "endLine": 37,
    "highlights": [
      21,
      23,
      27,
      28,
      33,
      34,
      35
    ],
    "note": "关闭协议先拒绝新任务并等待排空，超时再中断；调用线程被中断时还要恢复自己的中断状态。",
    "filename": "GracefulExecutor.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson10/GracefulExecutor.java#L16-L37",
    "code": "    public static ShutdownResult shutdownAndAwait(\n            ExecutorService executor,\n            Duration timeout\n    ) {\n        long timeoutNanos = timeout.toNanos();\n        executor.shutdown();\n        try {\n            if (executor.awaitTermination(timeoutNanos, TimeUnit.NANOSECONDS)) {\n                return new ShutdownResult(true, List.of(), false);\n            }\n\n            List<Runnable> neverStarted = executor.shutdownNow();\n            boolean terminated = executor.awaitTermination(\n                    timeoutNanos,\n                    TimeUnit.NANOSECONDS\n            );\n            return new ShutdownResult(terminated, List.copyOf(neverStarted), true);\n        } catch (InterruptedException exception) {\n            List<Runnable> neverStarted = executor.shutdownNow();\n            Thread.currentThread().interrupt();\n            return new ShutdownResult(false, List.copyOf(neverStarted), true);\n        }"
  },
  {
    "key": "10-exercise",
    "tab": "关闭练习",
    "path": "src/main/java/com/caesaemc/juc/lesson10/ShutdownExercise.java",
    "startLine": 9,
    "endLine": 18,
    "highlights": [
      14,
      15,
      16,
      17
    ],
    "note": "当前实现没有等待、强制阶段和总预算；练习需要完成 shutdown → await → shutdownNow 的完整协议。",
    "filename": "ShutdownExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson10/ShutdownExercise.java#L9-L18",
    "code": "public final class ShutdownExercise {\n\n    private ShutdownExercise() {\n    }\n\n    public static boolean shutdown(ExecutorService executor, Duration timeout) {\n        // TODO：实现有总超时意识的两阶段关闭。\n        executor.shutdown();\n        return executor.isTerminated();\n    }"
  },
  {
    "key": "11-aggregate",
    "tab": "多结果聚合",
    "path": "src/main/java/com/caesaemc/juc/lesson11/AsyncAggregator.java",
    "startLine": 25,
    "endLine": 47,
    "highlights": [
      29,
      31,
      32,
      33,
      34,
      35,
      36,
      40,
      42,
      43,
      45,
      46
    ],
    "note": "每个来源先转为 Outcome，失败不会抹掉其他成功结果；allOf 只协调完成，原始 Future 保留类型化数据。",
    "filename": "AsyncAggregator.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson11/AsyncAggregator.java#L25-L47",
    "code": "    public CompletableFuture<Aggregation> aggregate(\n            Map<String, Supplier<String>> sources,\n            Duration perSourceTimeout\n    ) {\n        Map<String, CompletableFuture<Outcome>> outcomes = new LinkedHashMap<>();\n        sources.forEach((name, source) -> {\n            CompletableFuture<Outcome> outcome = CompletableFuture\n                    .supplyAsync(source, executor)\n                    .orTimeout(perSourceTimeout.toNanos(), TimeUnit.NANOSECONDS)\n                    .handle((value, failure) -> failure == null\n                            ? Outcome.success(name, value)\n                            : Outcome.failure(name, unwrap(failure)));\n            outcomes.put(name, outcome);\n        });\n\n        CompletableFuture<?>[] all = outcomes.values()\n                .toArray(CompletableFuture[]::new);\n        return CompletableFuture.allOf(all)\n                .thenApply(ignored -> {\n                    List<Outcome> ordered = new ArrayList<>();\n                    outcomes.values().forEach(future -> ordered.add(future.join()));\n                    return new Aggregation(List.copyOf(ordered));\n                });"
  },
  {
    "key": "11-composition",
    "tab": "依赖与合并",
    "path": "src/main/java/com/caesaemc/juc/lesson11/CompositionDemo.java",
    "startLine": 14,
    "endLine": 27,
    "highlights": [
      19,
      22,
      26
    ],
    "note": "依赖异步调用使用 thenCompose 展平；两个独立上游并行启动后使用 thenCombine 合并。",
    "filename": "CompositionDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson11/CompositionDemo.java#L14-L27",
    "code": "    public static CompletableFuture<String> dependent(\n            String userId,\n            Function<String, CompletableFuture<String>> loadUser,\n            Function<String, CompletableFuture<String>> loadOrders\n    ) {\n        return loadUser.apply(userId).thenCompose(loadOrders);\n    }\n\n    public static CompletableFuture<String> independent(\n            CompletableFuture<String> profile,\n            CompletableFuture<String> preference\n    ) {\n        return profile.thenCombine(preference, (left, right) -> left + \":\" + right);\n    }"
  },
  {
    "key": "11-exercise",
    "tab": "编排练习",
    "path": "src/main/java/com/caesaemc/juc/lesson11/CompositionExercise.java",
    "startLine": 14,
    "endLine": 29,
    "highlights": [
      19,
      20,
      23,
      28,
      29
    ],
    "note": "thenApply 返回嵌套 Future；练习要求 loadFlat 返回单层 CompletableFuture，并保留正确的数据依赖。",
    "filename": "CompositionExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson11/CompositionExercise.java#L14-L29",
    "code": "    public static CompletableFuture<CompletableFuture<String>> loadNested(\n            String id,\n            Function<String, CompletableFuture<String>> loadUser,\n            Function<String, CompletableFuture<String>> loadDetail\n    ) {\n        // TODO：新增返回 CompletableFuture<String> 的 loadFlat，使用 thenCompose。\n        return loadUser.apply(id).thenApply(loadDetail);\n    }\n\n    public static CompletableFuture<String> loadFlat(\n            String id,\n            Function<String, CompletableFuture<String>> loadUser,\n            Function<String, CompletableFuture<String>> loadDetail\n    ) {\n        // TODO：使用 thenCompose 展平依赖调用。\n        throw new UnsupportedOperationException(\"请完成 loadFlat\");"
  },
  {
    "key": "12-forkjoin",
    "tab": "分治任务",
    "path": "src/main/java/com/caesaemc/juc/lesson12/ParallelSumTask.java",
    "startLine": 26,
    "endLine": 42,
    "highlights": [
      28,
      29,
      30,
      33,
      36,
      37,
      38,
      39,
      40,
      41
    ],
    "note": "小任务顺序计算；大任务 fork 一个分支、当前线程 compute 另一个，再 join 合并，减少无效调度。",
    "filename": "ParallelSumTask.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson12/ParallelSumTask.java#L26-L42",
    "code": "    @Override\n    protected Long compute() {\n        if (end - start <= THRESHOLD) {\n            long sum = 0;\n            for (int index = start; index < end; index++) {\n                sum += values[index];\n            }\n            return sum;\n        }\n\n        int middle = (start + end) >>> 1;\n        ParallelSumTask left = new ParallelSumTask(values, start, middle);\n        ParallelSumTask right = new ParallelSumTask(values, middle, end);\n        left.fork();\n        long rightResult = right.compute();\n        return left.join() + rightResult;\n    }"
  },
  {
    "key": "12-blocker",
    "tab": "阻塞补偿",
    "path": "src/main/java/com/caesaemc/juc/lesson12/ManagedBlockerDemo.java",
    "startLine": 14,
    "endLine": 46,
    "highlights": [
      15,
      16,
      20,
      29,
      30,
      33,
      36,
      41,
      42,
      45
    ],
    "note": "ManagedBlocker 把即将阻塞的信息告诉 ForkJoinPool，使其有机会评估补偿；它不会替代超时或资源限流。",
    "filename": "ManagedBlockerDemo.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson12/ManagedBlockerDemo.java#L14-L46",
    "code": "    public static boolean managedSleep(Duration duration) throws InterruptedException {\n        SleepBlocker blocker = new SleepBlocker(duration);\n        ForkJoinPool.managedBlock(blocker);\n        return blocker.isReleasable();\n    }\n\n    private static final class SleepBlocker implements ForkJoinPool.ManagedBlocker {\n        private final long deadlineNanos;\n        private boolean done;\n\n        private SleepBlocker(Duration duration) {\n            deadlineNanos = System.nanoTime() + duration.toNanos();\n        }\n\n        @Override\n        public boolean block() throws InterruptedException {\n            while (!isReleasable()) {\n                long remaining = deadlineNanos - System.nanoTime();\n                if (remaining > 0) {\n                    Thread.sleep(Duration.ofNanos(remaining));\n                }\n            }\n            done = true;\n            return true;\n        }\n\n        @Override\n        public boolean isReleasable() {\n            if (!done && System.nanoTime() >= deadlineNanos) {\n                done = true;\n            }\n            return done;\n        }"
  },
  {
    "key": "12-exercise",
    "tab": "最大值练习",
    "path": "src/main/java/com/caesaemc/juc/lesson12/MaxTaskExercise.java",
    "startLine": 24,
    "endLine": 28,
    "highlights": [
      25,
      26,
      27
    ],
    "note": "练习需要补齐阈值、左右拆分、fork/compute/join 与合并，并拒绝空数组。",
    "filename": "MaxTaskExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson12/MaxTaskExercise.java#L24-L28",
    "code": "    @Override\n    protected Integer compute() {\n        // TODO：小任务顺序求最大值，大任务一分为二并合并结果。\n        return values[start];\n    }"
  },
  {
    "key": "13-virtual",
    "tab": "每任务一线程",
    "path": "src/main/java/com/caesaemc/juc/lesson13/VirtualThreadAggregator.java",
    "startLine": 20,
    "endLine": 43,
    "highlights": [
      24,
      25,
      27,
      31,
      32,
      33,
      36,
      37,
      38,
      39,
      42
    ],
    "note": "虚拟线程承载大量独立阻塞任务，invokeAll 的同一 timeout 约束整组任务，取消结果被显式保留。",
    "filename": "VirtualThreadAggregator.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson13/VirtualThreadAggregator.java#L20-L43",
    "code": "    public static <T> List<Outcome<T>> invokeAll(\n            List<? extends Callable<T>> tasks,\n            Duration timeout\n    ) throws InterruptedException {\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            List<Future<T>> futures = executor.invokeAll(\n                    tasks,\n                    timeout.toNanos(),\n                    TimeUnit.NANOSECONDS\n            );\n            List<Outcome<T>> outcomes = new ArrayList<>(futures.size());\n            for (Future<T> future : futures) {\n                if (future.isCancelled()) {\n                    outcomes.add(Outcome.cancelledOutcome());\n                    continue;\n                }\n                try {\n                    outcomes.add(Outcome.success(future.get()));\n                } catch (ExecutionException exception) {\n                    outcomes.add(Outcome.failure(exception.getCause()));\n                }\n            }\n            return List.copyOf(outcomes);\n        }"
  },
  {
    "key": "13-capacity",
    "tab": "资源容量",
    "path": "src/main/java/com/caesaemc/juc/lesson13/LimitedVirtualThreadService.java",
    "startLine": 24,
    "endLine": 46,
    "highlights": [
      25,
      28,
      29,
      30,
      31,
      32,
      34,
      35,
      36,
      42,
      43
    ],
    "note": "虚拟线程数量与外部资源容量分离：每任务一个线程，Semaphore 单独限制真正的在途资源。",
    "filename": "LimitedVirtualThreadService.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson13/LimitedVirtualThreadService.java#L24-L46",
    "code": "    public <T> List<T> invoke(List<? extends Callable<T>> calls) throws Exception {\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            List<Future<T>> futures = new ArrayList<>();\n            for (Callable<T> call : calls) {\n                futures.add(executor.submit(() -> {\n                    permits.acquire();\n                    int current = active.incrementAndGet();\n                    maxObserved.accumulateAndGet(current, Math::max);\n                    try {\n                        return call.call();\n                    } finally {\n                        active.decrementAndGet();\n                        permits.release();\n                    }\n                }));\n            }\n\n            List<T> results = new ArrayList<>();\n            for (Future<T> future : futures) {\n                results.add(future.get());\n            }\n            return List.copyOf(results);\n        }"
  },
  {
    "key": "13-exercise",
    "tab": "迁移练习",
    "path": "src/main/java/com/caesaemc/juc/lesson13/VirtualResourceExercise.java",
    "startLine": 16,
    "endLine": 26,
    "highlights": [
      16,
      17,
      18,
      21,
      25,
      26
    ],
    "note": "破损版本既泄漏执行器，也没有资源背压；练习要求限定生命周期并用 Semaphore 保护下游。",
    "filename": "VirtualResourceExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson13/VirtualResourceExercise.java#L16-L26",
    "code": "    public static <T> List<Future<T>> submitAllBroken(List<? extends Callable<T>> calls) {\n        var executor = Executors.newVirtualThreadPerTaskExecutor();\n        return calls.stream().map(executor::submit).toList();\n    }\n\n    public static <T> List<T> invokeAll(\n            List<? extends Callable<T>> calls,\n            int resourceCapacity\n    ) throws Exception {\n        // TODO：限定 executor 生命周期，并使用 Semaphore 限制资源并发。\n        throw new UnsupportedOperationException(\"请完成 invokeAll\");"
  },
  {
    "key": "14-deadline",
    "tab": "共享预算",
    "path": "src/main/java/com/caesaemc/juc/lesson14/DeadlineBudget.java",
    "startLine": 17,
    "endLine": 51,
    "highlights": [
      23,
      24,
      27,
      31,
      38,
      39,
      42,
      46,
      51
    ],
    "note": "入口只计算一次绝对 deadline；每一步从单调时钟重新计算剩余时间，并与单步上限取最小值。",
    "filename": "DeadlineBudget.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson14/DeadlineBudget.java#L17-L51",
    "code": "    public static DeadlineBudget after(Duration timeout) {\n        Objects.requireNonNull(timeout, \"timeout\");\n        if (timeout.isNegative() || timeout.isZero()) {\n            throw new IllegalArgumentException(\"timeout 必须大于 0\");\n        }\n\n        long now = System.nanoTime();\n        long timeoutNanos = timeout.toNanos();\n        long deadline;\n        try {\n            deadline = Math.addExact(now, timeoutNanos);\n        } catch (ArithmeticException ignored) {\n            deadline = Long.MAX_VALUE;\n        }\n        return new DeadlineBudget(deadline);\n    }\n\n    public Duration remaining() {\n        return Duration.ofNanos(remainingNanos());\n    }\n\n    public long remainingNanos() {\n        return Math.max(0L, deadlineNanos - System.nanoTime());\n    }\n\n    public boolean expired() {\n        return remainingNanos() == 0L;\n    }\n\n    public Duration cap(Duration requestedTimeout) {\n        Objects.requireNonNull(requestedTimeout, \"requestedTimeout\");\n        if (requestedTimeout.isNegative() || requestedTimeout.isZero()) {\n            throw new IllegalArgumentException(\"requestedTimeout 必须大于 0\");\n        }\n        return Duration.ofNanos(Math.min(remainingNanos(), requestedTimeout.toNanos()));"
  },
  {
    "key": "14-memoizer",
    "tab": "单飞缓存",
    "path": "src/main/java/com/caesaemc/juc/lesson14/Memoizer.java",
    "startLine": 18,
    "endLine": 41,
    "highlights": [
      22,
      23,
      24,
      25,
      26,
      27,
      29,
      34,
      35,
      36,
      37,
      38,
      39
    ],
    "note": "缓存 Future 让并发调用者共享正在进行的计算；失败或取消后条件删除，下一次调用可以重试。",
    "filename": "Memoizer.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson14/Memoizer.java#L18-L41",
    "code": "    public V compute(K key, Callable<V> loader) throws Exception {\n        Objects.requireNonNull(key, \"key\");\n        Objects.requireNonNull(loader, \"loader\");\n\n        while (true) {\n            Future<V> future = cache.get(key);\n            if (future == null) {\n                FutureTask<V> candidate = new FutureTask<>(loader);\n                future = cache.putIfAbsent(key, candidate);\n                if (future == null) {\n                    future = candidate;\n                    candidate.run();\n                }\n            }\n\n            try {\n                return future.get();\n            } catch (CancellationException exception) {\n                cache.remove(key, future);\n            } catch (ExecutionException exception) {\n                cache.remove(key, future);\n                throw rethrow(exception.getCause());\n            }\n        }"
  },
  {
    "key": "14-exercise",
    "tab": "Bulkhead 练习",
    "path": "src/main/java/com/caesaemc/juc/lesson14/BulkheadExercise.java",
    "startLine": 9,
    "endLine": 22,
    "highlights": [
      11,
      12,
      15,
      17,
      18,
      20,
      21
    ],
    "note": "练习把容量、限时等待、超时降级和许可释放写进同一个调用协议，并保留中断语义。",
    "filename": "BulkheadExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson14/BulkheadExercise.java#L9-L22",
    "code": "public final class BulkheadExercise {\n\n    public BulkheadExercise(int capacity) {\n        // TODO：创建公平 Semaphore，并校验 capacity。\n    }\n\n    public <T> T call(\n            Callable<T> action,\n            Duration timeout,\n            T fallback\n    ) throws Exception {\n        // TODO：限时获取许可，在 finally 中释放；超时时返回 fallback。\n        return action.call();\n    }"
  },
  {
    "key": "15-harness",
    "tab": "确定性测试",
    "path": "src/main/java/com/caesaemc/juc/lesson15/ConcurrentTestHarness.java",
    "startLine": 25,
    "endLine": 74,
    "highlights": [
      34,
      35,
      36,
      45,
      46,
      47,
      52,
      53,
      56,
      60,
      61,
      62,
      66,
      67,
      70,
      73
    ],
    "note": "ready/start 两个门闩建立可控时序，准备和结果收集共享一个 deadline，任何失败都会取消其余 actor。",
    "filename": "ConcurrentTestHarness.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson15/ConcurrentTestHarness.java#L25-L74",
    "code": "    public static <T> List<T> runTogether(\n            List<? extends Callable<T>> actors,\n            Duration timeout\n    ) throws Exception {\n        Objects.requireNonNull(actors, \"actors\");\n        if (actors.isEmpty()) {\n            return List.of();\n        }\n\n        DeadlineBudget budget = DeadlineBudget.after(timeout);\n        CountDownLatch ready = new CountDownLatch(actors.size());\n        CountDownLatch start = new CountDownLatch(1);\n\n        try (var executor = Executors.newFixedThreadPool(\n                actors.size(),\n                Thread.ofPlatform().name(\"test-actor-\", 0).factory()\n        )) {\n            List<Future<T>> futures = new ArrayList<>(actors.size());\n            for (Callable<T> actor : actors) {\n                Objects.requireNonNull(actor, \"actor\");\n                futures.add(executor.submit(() -> {\n                    ready.countDown();\n                    start.await();\n                    return actor.call();\n                }));\n            }\n\n            if (!ready.await(budget.remainingNanos(), TimeUnit.NANOSECONDS)) {\n                futures.forEach(future -> future.cancel(true));\n                throw new TimeoutException(\"actor 未能在 deadline 前全部就绪\");\n            }\n            start.countDown();\n\n            List<T> results = new ArrayList<>(futures.size());\n            try {\n                for (Future<T> future : futures) {\n                    results.add(future.get(\n                            budget.remainingNanos(),\n                            TimeUnit.NANOSECONDS\n                    ));\n                }\n            } catch (InterruptedException | TimeoutException exception) {\n                futures.forEach(future -> future.cancel(true));\n                throw exception;\n            } catch (ExecutionException exception) {\n                futures.forEach(future -> future.cancel(true));\n                throw rethrow(exception.getCause());\n            }\n            return List.copyOf(results);\n        }"
  },
  {
    "key": "15-diagnostic",
    "tab": "堆积故障",
    "path": "src/main/java/com/caesaemc/juc/lesson15/DiagnosticFaultLab.java",
    "startLine": 62,
    "endLine": 89,
    "highlights": [
      63,
      64,
      65,
      66,
      69,
      70,
      71,
      72,
      76,
      77,
      80,
      82,
      86,
      87
    ],
    "note": "两个 worker 被锁存器占满，后续 80 个任务稳定堆积；线程 dump 与 metrics 共同形成根因证据。",
    "filename": "DiagnosticFaultLab.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson15/DiagnosticFaultLab.java#L62-L89",
    "code": "    private static void runBacklog(Duration duration) throws Exception {\n        InstrumentedThreadPool pool = new InstrumentedThreadPool(\n                2,\n                2,\n                100,\n                \"backlog\"\n        );\n        CountDownLatch release = new CountDownLatch(1);\n        for (int index = 0; index < 2; index++) {\n            pool.submit(() -> {\n                release.await();\n                return null;\n            });\n        }\n        for (int index = 0; index < 80; index++) {\n            pool.submit(() -> \"queued\");\n        }\n        try {\n            long deadline = System.nanoTime() + duration.toNanos();\n            while (System.nanoTime() < deadline) {\n                System.out.println(pool.metrics());\n                Thread.sleep(Math.min(1_000, duration.toMillis()));\n            }\n        } finally {\n            release.countDown();\n            pool.shutdownNow();\n            pool.awaitTermination(2, TimeUnit.SECONDS);\n        }"
  },
  {
    "key": "15-exercise",
    "tab": "竞态练习",
    "path": "src/main/java/com/caesaemc/juc/lesson15/DeterministicRaceExercise.java",
    "startLine": 6,
    "endLine": 14,
    "highlights": [
      11,
      12,
      13
    ],
    "note": "目标不是增加随机概率，而是用两个阶段的同步点稳定构造“先都读，再都写”的合法交错。",
    "filename": "DeterministicRaceExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson15/DeterministicRaceExercise.java#L6-L14",
    "code": "public final class DeterministicRaceExercise {\n\n    private DeterministicRaceExercise() {\n    }\n\n    public static int exposeLostUpdate() throws Exception {\n        // TODO：用两个阶段的屏障控制“读取”和“写入”，最终稳定返回 1。\n        throw new UnsupportedOperationException(\"请完成 exposeLostUpdate\");\n    }"
  },
  {
    "key": "16-engine",
    "tab": "聚合主线",
    "path": "src/main/java/com/caesaemc/juc/lesson16/AbstractAggregationService.java",
    "startLine": 57,
    "endLine": 148,
    "highlights": [
      65,
      66,
      69,
      72,
      73,
      74,
      76,
      88,
      89,
      95,
      97,
      113,
      133,
      135,
      136,
      137,
      145
    ],
    "note": "一次请求共享 DeadlineBudget；每个下游独立定时取消，提交失败进入 REJECTED，结果按原输入顺序收集。",
    "filename": "AbstractAggregationService.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson16/AbstractAggregationService.java#L57-L148",
    "code": "    public final AggregationResponse aggregate(\n            List<DownstreamCall> calls,\n            Duration overallTimeout\n    ) throws InterruptedException {\n        ensureOpen();\n        validateCalls(calls);\n\n        long aggregationStarted = System.nanoTime();\n        DeadlineBudget budget = DeadlineBudget.after(overallTimeout);\n        CallOutcome[] outcomes = new CallOutcome[calls.size()];\n        List<PendingCall> pending = new ArrayList<>(calls.size());\n\n        for (int index = 0; index < calls.size(); index++) {\n            DownstreamCall call = calls.get(index);\n            long submittedAt = System.nanoTime();\n            long timeoutNanos = Math.min(\n                    call.timeout().toNanos(),\n                    budget.remainingNanos()\n            );\n            if (timeoutNanos == 0L) {\n                CallOutcome outcome = CallOutcome.timedOut(\n                        call,\n                        elapsedSince(submittedAt)\n                );\n                outcomes[index] = outcome;\n                metrics.terminal(outcome.status());\n                continue;\n            }\n\n            AtomicBoolean timeoutTriggered = new AtomicBoolean();\n            try {\n                Future<CallOutcome> future = workers.submit(\n                        () -> invokeDownstream(call, submittedAt)\n                );\n                metrics.submitted();\n\n                ScheduledFuture<?> timer;\n                try {\n                    timer = timeoutScheduler.schedule(() -> {\n                        timeoutTriggered.set(true);\n                        if (!future.cancel(true)) {\n                            timeoutTriggered.set(false);\n                        }\n                    }, timeoutNanos, TimeUnit.NANOSECONDS);\n                } catch (RejectedExecutionException exception) {\n                    future.cancel(true);\n                    CallOutcome outcome = CallOutcome.rejected(\n                            call,\n                            exception,\n                            elapsedSince(submittedAt)\n                    );\n                    outcomes[index] = outcome;\n                    metrics.terminal(outcome.status());\n                    continue;\n                }\n\n                pending.add(new PendingCall(\n                        index,\n                        call,\n                        submittedAt,\n                        future,\n                        timer,\n                        timeoutTriggered,\n                        new AtomicBoolean()\n                ));\n            } catch (RejectedExecutionException exception) {\n                CallOutcome outcome = CallOutcome.rejected(\n                        call,\n                        exception,\n                        elapsedSince(submittedAt)\n                );\n                outcomes[index] = outcome;\n                metrics.terminal(outcome.status());\n            }\n        }\n\n        try {\n            for (PendingCall call : pending) {\n                CallOutcome outcome = await(call, budget);\n                call.timer().cancel(false);\n                outcomes[call.index()] = outcome;\n                recordOnce(call, outcome.status());\n            }\n        } catch (InterruptedException exception) {\n            cancelPending(pending);\n            throw exception;\n        }\n\n        return new AggregationResponse(\n                Arrays.asList(outcomes),\n                elapsedSince(aggregationStarted)\n        );"
  },
  {
    "key": "16-platform",
    "tab": "平台线程",
    "path": "src/main/java/com/caesaemc/juc/lesson16/PlatformAggregationService.java",
    "startLine": 25,
    "endLine": 42,
    "highlights": [
      34,
      35,
      36,
      39,
      40,
      41
    ],
    "note": "固定 worker 控制平台线程，有界队列控制排队内存，AbortPolicy 把满载变成可观察的背压信号。",
    "filename": "PlatformAggregationService.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson16/PlatformAggregationService.java#L25-L42",
    "code": "    private static ThreadPoolExecutor createExecutor(\n            int workers,\n            int queueCapacity\n    ) {\n        if (workers <= 0 || queueCapacity <= 0) {\n            throw new IllegalArgumentException(\n                    \"workers 和 queueCapacity 必须大于 0\"\n            );\n        }\n        return new ThreadPoolExecutor(\n                workers,\n                workers,\n                0L,\n                TimeUnit.MILLISECONDS,\n                new ArrayBlockingQueue<>(queueCapacity),\n                Thread.ofPlatform().name(\"platform-downstream-\", 0).factory(),\n                new ThreadPoolExecutor.AbortPolicy()\n        );"
  },
  {
    "key": "16-virtual",
    "tab": "虚拟线程",
    "path": "src/main/java/com/caesaemc/juc/lesson16/VirtualAggregationService.java",
    "startLine": 8,
    "endLine": 18,
    "highlights": [
      11,
      13,
      14,
      16
    ],
    "note": "每个下游一个虚拟线程；resourceCapacity 仍交给共享 Semaphore，执行载体和资源容量不混为一谈。",
    "filename": "VirtualAggregationService.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson16/VirtualAggregationService.java#L8-L18",
    "code": "public final class VirtualAggregationService\n        extends AbstractAggregationService {\n\n    public VirtualAggregationService(int resourceCapacity) {\n        super(\n                Executors.newThreadPerTaskExecutor(\n                        Thread.ofVirtual().name(\"virtual-downstream-\", 0).factory()\n                ),\n                resourceCapacity,\n                \"virtual-aggregation-timeouts\"\n        );"
  },
  {
    "key": "16-exercise",
    "tab": "降级练习",
    "path": "src/main/java/com/caesaemc/juc/lesson16/DegradationPolicyExercise.java",
    "startLine": 6,
    "endLine": 20,
    "highlights": [
      11,
      12,
      13,
      16,
      17,
      18,
      19
    ],
    "note": "底层并发组件只输出稳定终态；接口层再把关键/非关键结果映射为 OK、PARTIAL、FAILED。",
    "filename": "DegradationPolicyExercise.java",
    "link": "https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/lesson16/DegradationPolicyExercise.java#L6-L20",
    "code": "public final class DegradationPolicyExercise {\n\n    private DegradationPolicyExercise() {\n    }\n\n    public static Decision decide(AggregationResponse response) {\n        // TODO：关键下游失败为 FAILED；仅非关键失败为 PARTIAL；全部成功为 OK。\n        return Decision.OK;\n    }\n\n    public enum Decision {\n        OK,\n        PARTIAL,\n        FAILED\n    }"
  }
] as const satisfies readonly SourceSnippet[];

export const sourceSnippetByKey = Object.fromEntries(
  sourceSnippets.map((source) => [source.key, source]),
) as Record<string, SourceSnippet>;
