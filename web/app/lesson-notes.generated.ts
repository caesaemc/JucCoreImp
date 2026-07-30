/* 此文件由 scripts/generate-lesson-notes.mjs 自动生成，请修改 docs/learning-journal/lesson-XX.md。 */

export type LessonNoteHeading = {
  readonly id: string;
  readonly label: string;
};

export type LessonNote = {
  readonly number: string;
  readonly title: string;
  readonly sourcePath: string;
  readonly sourceUrl: string;
  readonly contentHash: string;
  readonly headings: readonly LessonNoteHeading[];
  readonly html: string;
};

export const lessonNotes = {
  "01": {
    "number": "01",
    "title": "第 01 课：共享数据与 Java 内存模型",
    "sourcePath": "docs/learning-journal/lesson-01.md",
    "sourceUrl": "https://github.com/caesaemc/JucCoreImp/blob/main/docs/learning-journal/lesson-01.md",
    "contentHash": "334d9d01f6636a6f39db8edb79ab7e1292277022b18ff98a681f33b0265aacec",
    "headings": [
      {
        "id": "lesson-01-section-1",
        "label": "Todo"
      },
      {
        "id": "lesson-01-section-2",
        "label": "只记三句话"
      },
      {
        "id": "lesson-01-section-3",
        "label": "正确学习路径"
      },
      {
        "id": "lesson-01-section-4",
        "label": "丢失更新图"
      },
      {
        "id": "lesson-01-section-5",
        "label": "源码学习顺序"
      },
      {
        "id": "lesson-01-section-6",
        "label": "一个练习"
      },
      {
        "id": "lesson-01-section-7",
        "label": "三道面试题"
      },
      {
        "id": "lesson-01-section-11",
        "label": "学习记录"
      },
      {
        "id": "lesson-01-section-14",
        "label": "有价值问答"
      },
      {
        "id": "lesson-01-section-16",
        "label": "课后复盘"
      }
    ],
    "html": "<h1 id=\"lesson-01-document-title\">第 01 课：共享数据与 Java 内存模型</h1>\n<blockquote>状态：进行中<span class=\"md-quote-break\" aria-hidden=\"true\"></span>建议用时：60 分钟<span class=\"md-quote-break\" aria-hidden=\"true\"></span>学习页面：<a href=\"https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=01\" target=\"_blank\" rel=\"noreferrer\">打开第 01 课</a></blockquote>\n<p>这份文件既是讲义，也是学习记录。本课不再拆分多份文档。</p>\n<h2 id=\"lesson-01-section-1\">Todo</h2>\n<ul><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>读完本页“三句话”</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>看懂丢失更新内存图</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>阅读并运行三份源码</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>完成线程安全计数器练习</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>不看答案口述三道面试题</li></ul>\n<h2 id=\"lesson-01-section-2\">只记三句话</h2>\n<ol><li>共享数据：能被多个线程访问的对象字段。</li><li><code>value++</code> 不是一步，而是读取、加一、写回。</li><li>没有明确的同步保证，运行正常也可能只是碰巧。</li></ol>\n<h2 id=\"lesson-01-section-3\">正确学习路径</h2>\n<ol><li>先在动画中找到唯一共享数据：堆对象 <code>UnsafeCounter @C1</code> 的 <code>value</code> 字段。</li><li>再逐步播放 A、B 的读取、计算和写回，记录每一步 value 在哪里。</li><li>再阅读 <code>UnsafeCounter</code> 和确定性丢失更新实验，对照动画找源码依据。</li><li>运行示例，先写预测结果，再看程序输出。</li><li>最后完成线程安全计数器练习，并口述三道面试题。</li></ol>\n<p>这一课暂时不背 CPU 缓存结构。先建立“共享堆对象 + 独立线程栈 + happens-before 保证”的分析顺序。</p>\n<h2 id=\"lesson-01-section-4\">丢失更新图</h2>\n<pre data-language=\"text\"><code>┌──────────────────────────── JVM 进程（教学简化） ────────────────────────────┐\n│ 类元数据区：UnsafeCounter 的字段说明与方法代码                              │\n│   只保存字段说明和方法代码，不保存某个 UnsafeCounter 对象当前的 value。       │\n│                                                                             │\n│ 线程 A 的栈                   堆（共享）                    线程 B 的栈         │\n│ ┌────────────────┐       ┌──────────────────┐       ┌────────────────┐      │\n│ │ this → @C1     │       │ UnsafeCounter @C1│       │ this → @C1     │      │\n│ │ 旧值 0         │ ←读取─ │ int value = 0/1 │ ─读取→ │ 旧值 0         │      │\n│ │ 新值 1         │ ─写回→ │                  │ ←写回─ │ 新值 1         │      │\n│ └────────────────┘       └──────────────────┘       └────────────────┘      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\nA、B 都从共享对象读到 0，各自在自己的执行栈中算出 1，随后都把 1 写回同一个字段。\n第二次写入没有把 value 变成 2，因此丢失一次更新。</code></pre>\n<p>图中的“旧值/新值”是对 JVM 操作数栈中间值的易读命名，不是源码额外声明的变量。</p>\n<h2 id=\"lesson-01-section-5\">源码学习顺序</h2>\n<ol><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/SharedCounterLab.java\" target=\"_blank\" rel=\"noreferrer\">SharedCounterLab.java</a>：先找共享字段，再把 <code>value++</code> 拆成三步。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/LostUpdateLab.java\" target=\"_blank\" rel=\"noreferrer\">LostUpdateLab.java</a>：用两个门闩稳定构造合法的丢失更新时序。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/HappensBeforeLab.java\" target=\"_blank\" rel=\"noreferrer\">HappensBeforeLab.java</a>：观察 <code>start</code> 和 <code>join</code> 两条同步边。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/Course01Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course01Exercise.java</a>：检查同一把监视器怎样同时保护读写。</li></ol>\n<p>运行：</p>\n<pre data-language=\"bash\"><code>mvn -q -DskipTests package\njava -cp target/classes com.caesaemc.juc.course01.Course01Application</code></pre>\n<h2 id=\"lesson-01-section-6\">一个练习</h2>\n<p>目标：完成一个在多线程下不会丢失更新的计数器。</p>\n<p>修改 <a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course01/Course01Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course01Exercise.java</a>， 保证递增操作不会被其他线程插入，并且读取能看见已经完成的更新。</p>\n<pre data-language=\"bash\"><code>mvn -q -Dtest=Course01ExerciseTest test</code></pre>\n<p>完成后写一句证明：哪个共享字段被保护、读写使用了什么同步协议、为什么 两个线程不能再同时用同一个旧值写回。</p>\n<h2 id=\"lesson-01-section-7\">三道面试题</h2>\n<h3 id=\"lesson-01-section-8\">1. 为什么 <code>i++</code> 不是线程安全的？</h3>\n<p>因为它包含读取、计算、写回，多个线程会互相覆盖。</p>\n<h3 id=\"lesson-01-section-9\">2. 没有 happens-before 就一定读到旧值吗？</h3>\n<p>不一定，但程序没有可靠保证，碰巧正确不等于线程安全。</p>\n<h3 id=\"lesson-01-section-10\">3. <code>Thread.sleep()</code> 能解决可见性吗？</h3>\n<p>不能，它只影响调度，不建立内存同步保证。</p>\n<h2 id=\"lesson-01-section-11\">学习记录</h2>\n<h3 id=\"lesson-01-section-12\">2026-07-28：开始第一课</h3>\n<ul><li>已建立确定性丢失更新实验。</li><li>学习重点是先找共享字段，再拆解实际读写步骤。</li></ul>\n<h3 id=\"lesson-01-section-13\">2026-07-30：从第一课重新开始</h3>\n<ul><li>当前 Todo：第 1 项——读完一页讲义。</li><li>本次只学习共享数据、线程局部数据，以及 <code>value++</code> 实际包含的三步。</li><li>暂时不展开 CPU 缓存、指令重排等细节。</li><li>完成标准：能指出 <code>UnsafeCounter.value</code> 为什么是共享数据，并预测两个线程同时加一可能得到的结果。</li><li>根据学习反馈，网页内存图改为可逐步播放的运行时结构图，明确区分类元数据、堆对象和两个线程栈帧。</li></ul>\n<h2 id=\"lesson-01-section-14\">有价值问答</h2>\n<h3 id=\"lesson-01-section-15\">问题模板</h3>\n<ul><li>问题：</li><li>当时怎么想：</li><li>正确结论：</li><li>代码或实验依据：</li><li>一句话面试回答：</li></ul>\n<h2 id=\"lesson-01-section-16\">课后复盘</h2>\n<ul><li>我已经掌握：</li><li>我仍然容易混淆：</li><li>最有用的代码：</li><li>一周后需要重新回答的问题：</li></ul>"
  },
  "02": {
    "number": "02",
    "title": "第 02 课：volatile、synchronized 与安全发布",
    "sourcePath": "docs/learning-journal/lesson-02.md",
    "sourceUrl": "https://github.com/caesaemc/JucCoreImp/blob/main/docs/learning-journal/lesson-02.md",
    "contentHash": "1a8b2291f50badc86c4fe5e896ff151a8ad97a2384938b7a12bbeefaa638f792",
    "headings": [
      {
        "id": "lesson-02-section-1",
        "label": "Todo"
      },
      {
        "id": "lesson-02-section-2",
        "label": "只记三句话"
      },
      {
        "id": "lesson-02-section-3",
        "label": "正确学习路径"
      },
      {
        "id": "lesson-02-section-4",
        "label": "内存图"
      },
      {
        "id": "lesson-02-section-5",
        "label": "源码学习顺序"
      },
      {
        "id": "lesson-02-section-6",
        "label": "一个练习"
      },
      {
        "id": "lesson-02-section-7",
        "label": "三道面试题"
      },
      {
        "id": "lesson-02-section-11",
        "label": "学习记录"
      },
      {
        "id": "lesson-02-section-14",
        "label": "有价值问答"
      },
      {
        "id": "lesson-02-section-16",
        "label": "课后复盘"
      }
    ],
    "html": "<h1 id=\"lesson-02-document-title\">第 02 课：volatile、synchronized 与安全发布</h1>\n<blockquote>状态：进行中<span class=\"md-quote-break\" aria-hidden=\"true\"></span>建议用时：75 分钟<span class=\"md-quote-break\" aria-hidden=\"true\"></span>学习页面：<a href=\"https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=02\" target=\"_blank\" rel=\"noreferrer\">打开第 02 课</a></blockquote>\n<p>这份文件既是讲义，也是学习记录。本课不再拆分多份文档。</p>\n<h2 id=\"lesson-02-section-1\">Todo</h2>\n<ul><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>读完本页“三句话”</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>播放内存图，能解释对象、引用和发布边</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>阅读并运行三份源码</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>修复 <code>SequenceExercise</code> 并通过测试</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>不看答案口述三道面试题</li></ul>\n<h2 id=\"lesson-02-section-2\">只记三句话</h2>\n<ol><li><code>volatile</code>：一个线程写完，另一个线程能可靠看到；但 <code>value++</code> 仍会丢更新。</li><li><code>synchronized</code>：同一把锁一次只让一个线程进入；读和写必须用同一把锁。</li><li>安全发布：先把对象造完整，再通过一个共享入口交给其他线程。</li></ol>\n<p>选型口诀：</p>\n<pre data-language=\"text\"><code>只替换一个开关或引用       → volatile\n读取、判断、修改必须一起做 → synchronized / Lock\n多个字段必须是同一版本     → 不可变对象 + volatile 引用</code></pre>\n<h2 id=\"lesson-02-section-3\">正确学习路径</h2>\n<ol><li>先回顾第一课：<code>volatile int value</code> 不能让 <code>value++</code> 变成一步。</li><li>再播放安全发布动画，区分 writer 栈、堆中的 Settings 对象、共享 <code>current</code> 和 reader 栈。</li><li>阅读 <code>SafePublicationDemo</code>，把构造、volatile 写、volatile 读与字段读取对应到动画。</li><li>阅读 <code>DclSingleton</code>，理解第一次检查、锁内第二次检查和 volatile 发布各自作用。</li><li>完成序号练习，用同一把锁保护读取、加一、写回和读取结果。</li></ol>\n<h2 id=\"lesson-02-section-4\">内存图</h2>\n<pre data-language=\"text\"><code>┌──────────────────────────── Java 进程（教学简化） ─────────────────────────────┐\n│ Metaspace：ConfigRepository / Settings 的字段结构和方法代码                    │\n├──────────────┬──────────────────────────────────────┬──────────────────────────┤\n│ writer 线程栈 │                 共享堆               │ reader 线程栈             │\n│              │                                      │                          │\n│ candidate ───┼──→ Settings @S1                      │ snapshot ─────────────┐   │\n│      @S1     │    final fields: v=1,t=10,r=1        │      @S1              │   │\n│              │             ↑                        │                       │   │\n│              │ ConfigRepository @R1                 │                       │   │\n│              │ volatile current: @S0 → @S1 ─────────┼───────────────────────┘   │\n└──────────────┴──────────────────────────────────────┴──────────────────────────┘\n                         volatile 写 happens-before 后续 volatile 读</code></pre>\n<p>网页动画把数据更新拆成六步：</p>\n<ol><li>堆中 <code>current</code> 最初指向不可变的 <code>Settings @S0</code>。</li><li>writer 完整构造新的堆对象 <code>Settings @S1</code>，栈中 <code>candidate</code> 保存它的引用。</li><li>writer 通过一次 volatile 写把 <code>current</code> 从 <code>@S0</code> 替换为 <code>@S1</code>。</li><li>reader 通过 volatile 读把 <code>@S1</code> 放入自己栈中的 <code>snapshot</code>。</li><li>reader 始终通过同一个 <code>snapshot</code> 读取全部 final 字段。</li><li>checksum 校验成功，不会出现半新半旧的配置。</li></ol>\n<h2 id=\"lesson-02-section-5\">源码学习顺序</h2>\n<ol><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/VisibilityLab.java\" target=\"_blank\" rel=\"noreferrer\">VisibilityLab.java</a>：看 volatile 停止标志怎样在线程之间传递。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/SafePublicationLab.java\" target=\"_blank\" rel=\"noreferrer\">SafePublicationLab.java</a>：看完整对象怎样通过 <code>current</code> 交给读线程。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/DclSingleton.java\" target=\"_blank\" rel=\"noreferrer\">DclSingleton.java</a>：看第一次检查、加锁、第二次检查和发布。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/Course02Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course02Exercise.java</a>：检查两个方法是否遵循同一把锁。</li></ol>\n<p>运行：</p>\n<pre data-language=\"bash\"><code>mvn -q -DskipTests package\njava -cp target/classes com.caesaemc.juc.course02.Course02Application</code></pre>\n<p>观察时只回答：</p>\n<ul><li>共享数据是哪一个字段？</li><li>哪些线程读写它？</li><li>需要“看见新值”，还是“同一时间只能一个线程改”？</li></ul>\n<h2 id=\"lesson-02-section-6\">一个练习</h2>\n<p>目标：不使用原子类，让多个线程取得不重复、连续的序号。</p>\n<p>阅读并尝试重写 <a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course02/Course02Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course02Exercise.java</a>，让 <code>next()</code> 和 <code>current()</code> 使用同一把锁。</p>\n<pre data-language=\"bash\"><code>mvn -q -Dtest=Course02ExerciseTest test</code></pre>\n<p>完成后写一句证明：</p>\n<blockquote><code>next()</code> 的读取、加一、写回不能被另一个线程插入；<code>current()</code> 使用同一把锁，因此能看到之前已经完成的写入。</blockquote>\n<h2 id=\"lesson-02-section-7\">三道面试题</h2>\n<h3 id=\"lesson-02-section-8\">1. volatile 能保证 <code>value++</code> 线程安全吗？</h3>\n<p>不能。<code>value++</code> 包含读取、加一、写回。两个线程可能读到同一个旧值，再写回同一个新值。</p>\n<h3 id=\"lesson-02-section-9\">2. volatile 和 synchronized 怎么选？</h3>\n<p>只发布一个独立值时可用 <code>volatile</code>；多个步骤必须作为一个整体完成时用 <code>synchronized</code> 或锁。</p>\n<h3 id=\"lesson-02-section-10\">3. 什么是安全发布？</h3>\n<p>其他线程不只看见对象引用，还能看见对象已经构造完成的正确状态。</p>\n<h2 id=\"lesson-02-section-11\">学习记录</h2>\n<h3 id=\"lesson-02-section-12\">2026-07-29：开始第二课</h3>\n<ul><li>第二课已经拥有独立的 <code>course02</code> 主源码、运行入口和验收测试。</li><li>页面、Todo 和讲义已压缩，当前先看内存图，再读源码。</li><li>下一步：运行 <code>Course02Application</code>，先预测结果再看输出。</li></ul>\n<h3 id=\"lesson-02-section-13\">2026-07-30：内存图升级为可播放运行结构</h3>\n<ul><li>明确区分了 Metaspace 中的类结构、堆中的对象字段和线程栈中的局部引用。</li><li>动画逐步更新 <code>candidate</code>、<code>current</code>、<code>snapshot</code> 与读取字段，不再用一条静态箭头代替发布过程。</li><li>页面中的活动数据球只表示当前步骤真正移动的对象引用或字段读取。</li></ul>\n<h2 id=\"lesson-02-section-14\">有价值问答</h2>\n<p>后续只记录会改变理解、影响代码选择或适合面试复盘的问题。</p>\n<h3 id=\"lesson-02-section-15\">问题模板</h3>\n<ul><li>问题：</li><li>当时怎么想：</li><li>正确结论：</li><li>代码或实验依据：</li><li>一句话面试回答：</li></ul>\n<h2 id=\"lesson-02-section-16\">课后复盘</h2>\n<ul><li>我已经掌握：</li><li>我仍然容易混淆：</li><li>最有用的代码：</li><li>一周后需要重新回答的问题：</li></ul>"
  },
  "03": {
    "number": "03",
    "title": "第 03 课：线程协作、CAS、锁与同步器",
    "sourcePath": "docs/learning-journal/lesson-03.md",
    "sourceUrl": "https://github.com/caesaemc/JucCoreImp/blob/main/docs/learning-journal/lesson-03.md",
    "contentHash": "201d87ea4a19d80fc75b4ebf1fca02433fbd5984bb1a5109a03fb9229f2f3dfd",
    "headings": [
      {
        "id": "lesson-03-section-1",
        "label": "Todo"
      },
      {
        "id": "lesson-03-section-2",
        "label": "正确学习路径"
      },
      {
        "id": "lesson-03-section-3",
        "label": "只记三句话"
      },
      {
        "id": "lesson-03-section-4",
        "label": "中断与取消"
      },
      {
        "id": "lesson-03-section-5",
        "label": "CAS 与原子更新"
      },
      {
        "id": "lesson-03-section-6",
        "label": "AQS 与等待队列"
      },
      {
        "id": "lesson-03-section-7",
        "label": "Condition 与同步器"
      },
      {
        "id": "lesson-03-section-8",
        "label": "动画阅读方法"
      },
      {
        "id": "lesson-03-section-9",
        "label": "源码学习顺序"
      },
      {
        "id": "lesson-03-section-10",
        "label": "一个练习"
      },
      {
        "id": "lesson-03-section-11",
        "label": "三道面试题"
      },
      {
        "id": "lesson-03-section-15",
        "label": "学习记录"
      },
      {
        "id": "lesson-03-section-17",
        "label": "有价值问答"
      },
      {
        "id": "lesson-03-section-18",
        "label": "课后复盘"
      }
    ],
    "html": "<h1 id=\"lesson-03-document-title\">第 03 课：线程协作、CAS、锁与同步器</h1>\n<blockquote>状态：未开始<span class=\"md-quote-break\" aria-hidden=\"true\"></span>建议用时：2 × 75 分钟<span class=\"md-quote-break\" aria-hidden=\"true\"></span>学习页面：<a href=\"https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=03\" target=\"_blank\" rel=\"noreferrer\">打开第 03 课</a></blockquote>\n<p>这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。本课使用独立的 <code>course03</code> 主源码串起一条主线：线程收到停止请求，竞争共享状态，失败后 进入等待队列，条件满足后再被唤醒。</p>\n<h2 id=\"lesson-03-section-1\">Todo</h2>\n<ul><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>读完本课讲义并记住工具选择顺序</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>播放 AQS 动画并解释 <code>state</code>、<code>owner</code>、<code>head</code>、<code>tail</code></li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>阅读并运行中断、CAS、AQS 和 Semaphore 源码</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>重写 <code>Course03Exercise</code> 并通过测试</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>不看答案口述三道面试题</li></ul>\n<h2 id=\"lesson-03-section-2\">正确学习路径</h2>\n<ol><li>先学中断：理解“请求停止”而不是“强制杀死”。</li><li>再学 CAS：理解一个共享值如何在无锁条件下原子更新。</li><li>再学 AQS：理解 CAS 失败的线程为什么需要入队、阻塞和唤醒。</li><li>再学 Condition：理解等待业务条件与等待锁是两条不同队列。</li><li>最后学习 Semaphore、CountDownLatch 等同步器的选型。</li></ol>\n<p>不要一开始背 AQS 源码细节。先能画出状态、队列和线程迁移，再阅读实现。</p>\n<h2 id=\"lesson-03-section-3\">只记三句话</h2>\n<ol><li><code>interrupt()</code> 发送的是协作式取消信号，任务必须在安全点检查并收尾。</li><li>CAS 只有在观察值未变化时才更新；失败后必须重新读取并重新计算。</li><li>AQS 管理同步状态、等待队列、阻塞和唤醒，子类只定义获取与释放条件。</li></ol>\n<p>工具选择口诀：</p>\n<pre data-language=\"text\"><code>停止一个任务                         → interrupt + 任务主动退出\n一个共享值的短更新                   → Atomic 类或 CAS 循环\n保护多个字段和复合不变量             → Lock / synchronized\n等待“非空、非满”等业务条件           → Condition\n限制同时访问下游的数量               → Semaphore\n等待一组一次性任务完成               → CountDownLatch</code></pre>\n<h2 id=\"lesson-03-section-4\">中断与取消</h2>\n<p>线程的中断标志是一条状态信息。<code>interrupt()</code> 不会跳到目标线程里执行退出 逻辑，也不会自动释放目标线程持有的业务资源。</p>\n<p>任务通常在三类位置响应中断：</p>\n<ul><li>循环条件中调用 <code>isInterrupted()</code>。</li><li>阻塞方法抛出 <code>InterruptedException</code>。</li><li>业务安全点显式检查，并在退出前完成清理。</li></ul>\n<p><code>sleep</code>、<code>wait</code>、<code>join</code>、<code>BlockingQueue.take</code> 等方法抛出 <code>InterruptedException</code> 时会清除中断标志。如果当前方法不能把异常继续 抛给上层，应恢复中断状态并尽快结束当前工作：</p>\n<pre data-language=\"java\"><code>try {\n    queue.take();\n} catch (InterruptedException exception) {\n    Thread.currentThread().interrupt();\n    return;\n}</code></pre>\n<p>空的 <code>catch (InterruptedException ignored)</code> 会吞掉取消协议，是面试和 生产代码中的高频错误。</p>\n<h2 id=\"lesson-03-section-5\">CAS 与原子更新</h2>\n<p>CAS 可以理解为：</p>\n<pre data-language=\"text\"><code>如果共享值仍等于 expected\n    就把它更新为 update，并返回成功\n否则\n    不修改共享值，并返回失败</code></pre>\n<p>项目中的 <code>VarHandleCounter</code> 使用标准 CAS 重试循环：</p>\n<pre data-language=\"java\"><code>int observed;\ndo {\n    observed = (int) VALUE.getVolatile(this);\n} while (!VALUE.compareAndSet(this, observed, observed + 1));</code></pre>\n<p>每次失败都必须重新读取 <code>observed</code>，因为失败已经证明共享状态发生变化。 成功的 CAS 是这次递增操作的线性化点。</p>\n<p>CAS 适合状态较小、临界区很短的更新。复杂业务规则、高竞争或需要等待 条件时，持续重试可能浪费 CPU，锁通常更容易保证整体不变量。</p>\n<p>ABA 指值经历了 <code>A → B → A</code>。只比较当前值时无法发现中间变化；业务若 关心版本，应把版本号一起比较，例如使用 <code>AtomicStampedReference</code>。</p>\n<h2 id=\"lesson-03-section-6\">AQS 与等待队列</h2>\n<p>本课动画使用项目中的不可重入 <code>Mutex</code>。它把 AQS 的 <code>state</code> 定义为：</p>\n<pre data-language=\"text\"><code>state = 0  → 锁空闲\nstate = 1  → 锁已被 exclusiveOwnerThread 持有</code></pre>\n<p>一次典型的独占获取流程：</p>\n<ol><li>Thread A 执行 <code>CAS(0, 1)</code> 成功，成为 owner。</li><li>Thread B 执行同一个 CAS 失败。</li><li>AQS 为 B 创建等待节点并追加到同步队列。</li><li>B 被 <code>park</code>，停止持续空转。</li><li>A 清除 owner，并把 <code>state</code> 写回 0。</li><li>AQS <code>unpark</code> 有效后继 B。</li><li>B 醒来后重新竞争，成功后成为新 owner。</li></ol>\n<p><code>unpark</code> 不等于直接把锁交给 B。它只让 B 重新具备运行资格，B 仍要执行 获取协议。非公平锁允许新到线程在这一时刻参与竞争；公平锁会更严格地 检查队列前驱，但吞吐通常更低。</p>\n<h2 id=\"lesson-03-section-7\">Condition 与同步器</h2>\n<p>锁的同步队列保存“暂时拿不到锁”的线程。Condition 队列保存“已经拿到锁， 但业务条件不满足”的线程。</p>\n<p><code>await()</code> 的关键动作：</p>\n<ol><li>当前线程必须先持有关联的 Lock。</li><li>线程进入对应 Condition 队列。</li><li>完全释放锁，让修改条件的线程进入。</li><li>被 <code>signal()</code> 后转移到同步队列。</li><li>重新获得锁后，<code>await()</code> 才返回。</li></ol>\n<p>因此条件检查必须放在 <code>while</code> 中：</p>\n<pre data-language=\"java\"><code>lock.lockInterruptibly();\ntry {\n    while (count == 0) {\n        notEmpty.await();\n    }\n    // 条件成立，并且当前仍持锁\n} finally {\n    lock.unlock();\n}</code></pre>\n<p>常用同步器的本质都是“状态 + 等待协议”：</p>\n<ul><li><code>CountDownLatch</code>：状态递减到 0 后永久打开。</li><li><code>Semaphore</code>：状态表示剩余许可，可多线程同时通过。</li><li><code>CyclicBarrier</code>：一组线程分代到齐后一起继续。</li><li><code>ReentrantReadWriteLock</code>：读共享、写独占。</li><li><code>StampedLock</code>：提供写锁、悲观读和需要校验的乐观读。</li></ul>\n<h2 id=\"lesson-03-section-8\">动画阅读方法</h2>\n<p>播放网页中的七步 AQS 动画时，每一步只回答四个问题：</p>\n<ol><li><code>state</code> 当前是 0 还是 1？</li><li><code>exclusiveOwnerThread</code> 指向谁？</li><li>Thread B 在运行、竞争、等待，还是已经持锁？</li><li>本步移动的是 CAS、等待节点，还是 <code>unpark</code> 信号？</li></ol>\n<p>图中的队列只展示逻辑获取方向，省略双向链接和不同 JDK 版本的内部状态位。</p>\n<h2 id=\"lesson-03-section-9\">源码学习顺序</h2>\n<ol><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/TwoPhaseTerminator.java\" target=\"_blank\" rel=\"noreferrer\">TwoPhaseTerminator.java</a>：中断请求、恢复标志、<code>finally</code> 收尾和 <code>join</code> 验收。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/CasCounter.java\" target=\"_blank\" rel=\"noreferrer\">CasCounter.java</a>：CAS 失败后重新读取。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/AqsMutex.java\" target=\"_blank\" rel=\"noreferrer\">AqsMutex.java</a>：AQS 独占获取、等待和释放条件。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/ResourceGate.java\" target=\"_blank\" rel=\"noreferrer\">ResourceGate.java</a>：Semaphore 许可和异常路径释放。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/Course03Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course03Exercise.java</a>：中断异常后的恢复与退出。</li></ol>\n<p>本课唯一运行入口：</p>\n<pre data-language=\"bash\"><code>mvn -q -DskipTests package\njava -cp target/classes com.caesaemc.juc.course03.Course03Application</code></pre>\n<h2 id=\"lesson-03-section-10\">一个练习</h2>\n<p>目标：让可取消任务在收到中断后可靠停止，不吞掉取消信号。</p>\n<p>修改 <a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course03/Course03Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course03Exercise.java</a>， 在捕获 <code>InterruptedException</code> 后恢复中断标志并退出循环。</p>\n<pre data-language=\"bash\"><code>mvn -q -Dtest=Course03ExerciseTest test</code></pre>\n<p>完成后必须能解释：为什么阻塞方法抛出 <code>InterruptedException</code> 后需要恢复 标志，以及为什么不能继续无限循环。</p>\n<h2 id=\"lesson-03-section-11\">三道面试题</h2>\n<h3 id=\"lesson-03-section-12\">1. interrupt 为什么不是强制停止线程？</h3>\n<p>它只修改中断状态或让可中断阻塞抛出异常。任务何时检查、怎样释放资源和 何时退出，仍由任务代码决定。</p>\n<h3 id=\"lesson-03-section-13\">2. CAS 失败后为什么不能直接再次写入原来的新值？</h3>\n<p>失败说明 expected 已过期。必须重新读取最新状态，再根据最新状态计算 新值，否则会覆盖其他线程已经完成的更新。</p>\n<h3 id=\"lesson-03-section-14\">3. AQS 主要帮同步器解决什么问题？</h3>\n<p>它统一管理同步状态、同步队列、线程阻塞、唤醒、中断和取消；同步器子类 只需要定义什么情况下获取或释放成功。</p>\n<h2 id=\"lesson-03-section-15\">学习记录</h2>\n<h3 id=\"lesson-03-section-16\">2026-07-30：建立第三课独立源码</h3>\n<ul><li><code>course03</code> 统一承载“中断 → CAS → AQS → Semaphore”的学习主线。</li><li>网页动画选择 <code>Mutex</code> 的一次真实锁交接作为中心模型。</li><li>下一步：先运行 <code>TwoPhaseTerminator</code>，再播放 AQS 动画。</li></ul>\n<h2 id=\"lesson-03-section-17\">有价值问答</h2>\n<ul><li>问题：</li><li>当时怎么想：</li><li>正确结论：</li><li>代码或实验依据：</li><li>一句话面试回答：</li></ul>\n<h2 id=\"lesson-03-section-18\">课后复盘</h2>\n<ul><li>我已经掌握：</li><li>我仍然容易混淆：</li><li>我能否手画 AQS 状态和等待队列：</li><li>一周后需要重新回答的问题：</li></ul>"
  },
  "04": {
    "number": "04",
    "title": "第 04 课：并发集合、队列与生产消费",
    "sourcePath": "docs/learning-journal/lesson-04.md",
    "sourceUrl": "https://github.com/caesaemc/JucCoreImp/blob/main/docs/learning-journal/lesson-04.md",
    "contentHash": "7736feebe90c2872e6976b37578083a6ddb0b393e495725ddcd8405b449e7ef9",
    "headings": [
      {
        "id": "lesson-04-section-1",
        "label": "Todo"
      },
      {
        "id": "lesson-04-section-2",
        "label": "正确学习路径"
      },
      {
        "id": "lesson-04-section-3",
        "label": "只记三句话"
      },
      {
        "id": "lesson-04-section-4",
        "label": "并发 Map 的复合动作"
      },
      {
        "id": "lesson-04-section-5",
        "label": "ConcurrentHashMap 的理解边界"
      },
      {
        "id": "lesson-04-section-6",
        "label": "BlockingQueue 与背压"
      },
      {
        "id": "lesson-04-section-7",
        "label": "环形数组与条件队列"
      },
      {
        "id": "lesson-04-section-8",
        "label": "停止协议与批处理"
      },
      {
        "id": "lesson-04-section-9",
        "label": "动画阅读方法"
      },
      {
        "id": "lesson-04-section-10",
        "label": "源码学习顺序"
      },
      {
        "id": "lesson-04-section-11",
        "label": "一个练习"
      },
      {
        "id": "lesson-04-section-12",
        "label": "三道面试题"
      },
      {
        "id": "lesson-04-section-16",
        "label": "学习记录"
      },
      {
        "id": "lesson-04-section-18",
        "label": "有价值问答"
      },
      {
        "id": "lesson-04-section-19",
        "label": "课后复盘"
      }
    ],
    "html": "<h1 id=\"lesson-04-document-title\">第 04 课：并发集合、队列与生产消费</h1>\n<blockquote>状态：未开始<span class=\"md-quote-break\" aria-hidden=\"true\"></span>建议用时：90 分钟<span class=\"md-quote-break\" aria-hidden=\"true\"></span>学习页面：<a href=\"https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=04\" target=\"_blank\" rel=\"noreferrer\">打开第 04 课</a></blockquote>\n<p>这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。独立的 <code>course04</code> 主源码组成一条数据通道：先用并发容器原子建立数据，再通过有界队列把数据 安全交给消费者，并在过载时把压力传回生产者。</p>\n<h2 id=\"lesson-04-section-1\">Todo</h2>\n<ul><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>读完本课讲义并区分单次安全与复合安全</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>播放容器动画并解释 Map bin、队列槽位和两个索引</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>阅读并运行 ConcurrentHashMap 与 BlockingQueue 源码</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>重写 <code>Course04Exercise</code> 并通过测试</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>不看答案口述三道面试题</li></ul>\n<h2 id=\"lesson-04-section-2\">正确学习路径</h2>\n<ol><li>先判断业务动作是一次容器调用，还是多个调用组成的复合动作。</li><li>再学习 <code>computeIfAbsent</code>、<code>compute</code>、<code>merge</code> 等容器原子协议。</li><li>再学习 BlockingQueue 的容量、阻塞语义和停止协议。</li><li>最后把 Map 和 Queue 组合成有边界的生产消费流水线。</li></ol>\n<h2 id=\"lesson-04-section-3\">只记三句话</h2>\n<ol><li><code>ConcurrentHashMap</code> 的单次方法线程安全，不代表 <code>containsKey + put</code> 整体原子。</li><li>有界队列把过载变成明确的等待、超时或拒绝，无界队列把问题推迟成内存和延迟风险。</li><li>消费者必须有结束协议，不能在生产结束后永远阻塞在 <code>take()</code>。</li></ol>\n<p>选择口诀：</p>\n<pre data-language=\"text\"><code>同 key 缺失时建立一次值             → computeIfAbsent\n同 key 基于旧值更新                 → compute / merge\n固定容量 FIFO 数据通道              → ArrayBlockingQueue\n生产者与消费者必须直接配对           → SynchronousQueue\n延迟到期后才能消费                   → DelayQueue\n读多写极少的小快照集合               → CopyOnWriteArrayList</code></pre>\n<h2 id=\"lesson-04-section-4\">并发 Map 的复合动作</h2>\n<p>下面两次调用各自安全，但组合不安全：</p>\n<pre data-language=\"java\"><code>if (!map.containsKey(key)) {\n    map.put(key, load(key));\n}</code></pre>\n<p>两个线程可以同时通过检查，各自执行一次昂贵加载，最后一个 <code>put</code> 再覆盖 前一个结果。正确方向是让容器协议表达“缺失时建立”：</p>\n<pre data-language=\"java\"><code>V value = map.computeIfAbsent(key, loader);</code></pre>\n<p>这保证同一个 key 的映射建立过程由容器协调，但不意味着映射函数可以任意 执行复杂工作。映射函数应避免：</p>\n<ul><li>递归修改同一个 key。</li><li>长时间阻塞其他线程需要的计算。</li><li>难以重试或无法接受重复的外部副作用。</li></ul>\n<p>远程慢加载通常需要进一步存储 <code>Future&lt;V&gt;</code>，把“正在进行的计算”也作为 缓存值，并为失败、超时和失效建立明确协议。</p>\n<h2 id=\"lesson-04-section-5\">ConcurrentHashMap 的理解边界</h2>\n<p>面试不需要背某个 JDK 版本的全部私有字段，但需要理解以下稳定主线：</p>\n<ul><li>数据存储在 table 的 bin 中。</li><li>空 bin 可以通过 CAS 安装节点。</li><li>冲突 bin 的更新需要更细粒度协调。</li><li>冲突较高时 bin 可能树化，但阈值属于实现细节。</li><li>扩容可以由多个线程协助迁移。</li><li>遍历是弱一致的，不承诺全局瞬时快照。</li></ul>\n<p>“弱一致”不是线程不安全。它表示遍历期间允许并发更新，迭代器不会像 普通 <code>HashMap</code> 那样依赖 fail-fast 来表达并发语义。</p>\n<h2 id=\"lesson-04-section-6\">BlockingQueue 与背压</h2>\n<p>BlockingQueue 同时表达两件事：</p>\n<ol><li>数据从生产者移交给消费者。</li><li>容量不足或数据不足时，线程应该怎样等待。</li></ol>\n<p>常用方法语义：</p>\n<pre data-language=\"text\"><code>add / remove / element       → 失败时抛异常\noffer / poll / peek          → 立即返回特殊值\nput / take                   → 一直等待\noffer(timeout) / poll(timeout) → 限时等待</code></pre>\n<p>生产系统更偏向有界队列，因为容量上限能回答：</p>\n<ul><li>最多允许多少条数据占用内存？</li><li>队满后生产者阻塞、超时、丢弃还是降级？</li><li>允许的排队延迟是多少？</li><li>监控何时应该告警？</li></ul>\n<p>无界队列并没有消除过载，只是让过载首先表现为队列增长和尾延迟上升。</p>\n<h2 id=\"lesson-04-section-7\">环形数组与条件队列</h2>\n<p>网页动画使用容量为 3 的 <code>ArrayBlockingQueue</code>。核心状态包括：</p>\n<pre data-language=\"text\"><code>items[]    保存数据\nputIndex   下一次写入位置\ntakeIndex  下一次读取位置\ncount      当前元素数量\nnotFull    队满时生产者等待\nnotEmpty   队空时消费者等待</code></pre>\n<p>索引到达数组尾部后回到 0，因此物理槽位顺序不总是等于逻辑 FIFO 顺序。 <code>count</code> 负责区分“索引相等但队列为空”和“索引相等但队列已满”。</p>\n<p>队满时，<code>put</code> 在 <code>notFull</code> 上等待；消费者 <code>take</code> 清空一个槽位并 <code>signal notFull</code>。被通知的生产者仍要重新获得内部锁并再次检查条件。</p>\n<h2 id=\"lesson-04-section-8\">停止协议与批处理</h2>\n<p>消费者不能根据“暂时取不到数据”判断生产已经结束。常见停止方式：</p>\n<ul><li>poison pill：生产者放入约定的结束消息。</li><li>关闭外部生命周期并中断消费者。</li><li>使用显式 channel 状态表达 close。</li></ul>\n<p>poison pill 的数量通常至少要覆盖消费者数量，否则可能仍有消费者永远 等待。结束消息不能与合法业务数据混淆。</p>\n<p>批处理可使用 <code>drainTo</code> 减少锁竞争和下游调用次数，但必须同时约束：</p>\n<ul><li>最大批量，避免单批占用过多内存。</li><li>最大等待时间，避免低流量时迟迟不发送。</li><li>失败后的重试、拆批和幂等规则。</li></ul>\n<h2 id=\"lesson-04-section-9\">动画阅读方法</h2>\n<p>播放网页中的七步动画，依次观察：</p>\n<ol><li>Map 和容量为 3 的 Queue 在堆中创建。</li><li>producer 用 <code>computeIfAbsent(42, loader)</code> 建立映射。</li><li><code>42 → Profile-A</code> 进入目标 bin。</li><li>J1 写入 <code>items[0]</code>，<code>putIndex</code> 前进。</li><li>J1、J2、J3 填满队列，J4 的生产者等待 <code>notFull</code>。</li><li>consumer 取出 J1，<code>takeIndex</code> 前进并通知 <code>notFull</code>。</li><li>producer 重新竞争成功，把 J4 写进循环复用的槽位 0。</li></ol>\n<p>每一步同时核对 <code>items[]</code>、<code>putIndex</code>、<code>takeIndex</code>、<code>count</code> 和线程状态。</p>\n<h2 id=\"lesson-04-section-10\">源码学习顺序</h2>\n<ol><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/CompoundActionLab.java\" target=\"_blank\" rel=\"noreferrer\">CompoundActionLab.java</a>：稳定复现 <code>containsKey + put</code> 复合竞态。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/AtomicCache.java\" target=\"_blank\" rel=\"noreferrer\">AtomicCache.java</a>：使用 <code>computeIfAbsent</code>。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/BoundedPipeline.java\" target=\"_blank\" rel=\"noreferrer\">BoundedPipeline.java</a>：有界队列、消费者和结束信号。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/QueueSemanticsLab.java\" target=\"_blank\" rel=\"noreferrer\">QueueSemanticsLab.java</a>：直接移交队列语义。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/Course04Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course04Exercise.java</a>：同 key 原子加载练习。</li></ol>\n<p>运行本课：</p>\n<pre data-language=\"bash\"><code>mvn -q -DskipTests package\njava -cp target/classes com.caesaemc.juc.course04.Course04Application</code></pre>\n<h2 id=\"lesson-04-section-11\">一个练习</h2>\n<p>目标：让同一个 key 在并发访问时只执行一次加载。</p>\n<p>修改 <a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course04/Course04Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course04Exercise.java</a>， 把 <code>get + load + put</code> 改为容器提供的原子复合操作。</p>\n<pre data-language=\"bash\"><code>mvn -q -Dtest=Course04ExerciseTest test</code></pre>\n<p>完成后说明映射函数为什么不能递归更新同一个 key，以及慢远程调用为什么 还需要 Future、超时和失败清理。</p>\n<h2 id=\"lesson-04-section-12\">三道面试题</h2>\n<h3 id=\"lesson-04-section-13\">1. ConcurrentHashMap 的 put 安全，为什么 containsKey + put 不安全？</h3>\n<p>因为两个方法之间存在可被其他线程插入的时间窗口。单次方法的线程安全 不能自动扩展到多个方法组成的业务事务。</p>\n<h3 id=\"lesson-04-section-14\">2. 为什么生产环境通常选择有界队列？</h3>\n<p>有界队列能把容量和满载策略显式化，避免任务无限占用内存，并让过载及时 表现为阻塞、超时或拒绝。</p>\n<h3 id=\"lesson-04-section-15\">3. ArrayBlockingQueue 和 SynchronousQueue 的核心区别是什么？</h3>\n<p>前者有固定数组容量，可以暂存有限元素；后者容量为 0，每次移交都要求 生产者和消费者直接配对。</p>\n<h2 id=\"lesson-04-section-16\">学习记录</h2>\n<h3 id=\"lesson-04-section-17\">2026-07-30：建立第四课独立源码</h3>\n<ul><li><code>course04</code> 统一承载“原子容器操作 → 有界数据通道 → 背压与停止协议”。</li><li>网页动画同时展示 CHM 映射和 ArrayBlockingQueue 环形数组状态。</li><li>下一步：先预测 <code>CompoundActionLab</code> 的加载次数，再运行验证。</li></ul>\n<h2 id=\"lesson-04-section-18\">有价值问答</h2>\n<ul><li>问题：</li><li>当时怎么想：</li><li>正确结论：</li><li>代码或实验依据：</li><li>一句话面试回答：</li></ul>\n<h2 id=\"lesson-04-section-19\">课后复盘</h2>\n<ul><li>我已经掌握：</li><li>我仍然容易混淆：</li><li>我能否解释队满时线程去了哪里：</li><li>一周后需要重新回答的问题：</li></ul>"
  },
  "05": {
    "number": "05",
    "title": "第 05 课：线程池、异步任务与虚拟线程",
    "sourcePath": "docs/learning-journal/lesson-05.md",
    "sourceUrl": "https://github.com/caesaemc/JucCoreImp/blob/main/docs/learning-journal/lesson-05.md",
    "contentHash": "0ad273803427bfc08118d4bf28056e71910dd2ff1cde1900e2a6197e496f11e7",
    "headings": [
      {
        "id": "lesson-05-section-1",
        "label": "Todo"
      },
      {
        "id": "lesson-05-section-2",
        "label": "正确学习路径"
      },
      {
        "id": "lesson-05-section-3",
        "label": "只记三句话"
      },
      {
        "id": "lesson-05-section-4",
        "label": "ThreadPoolExecutor 接纳路径"
      },
      {
        "id": "lesson-05-section-5",
        "label": "Worker、ctl 与拒绝"
      },
      {
        "id": "lesson-05-section-6",
        "label": "Future、超时与取消"
      },
      {
        "id": "lesson-05-section-7",
        "label": "CompletableFuture 编排"
      },
      {
        "id": "lesson-05-section-8",
        "label": "ForkJoinPool 与任务模型"
      },
      {
        "id": "lesson-05-section-9",
        "label": "虚拟线程"
      },
      {
        "id": "lesson-05-section-10",
        "label": "动画阅读方法"
      },
      {
        "id": "lesson-05-section-11",
        "label": "源码学习顺序"
      },
      {
        "id": "lesson-05-section-12",
        "label": "一个练习"
      },
      {
        "id": "lesson-05-section-13",
        "label": "三道面试题"
      },
      {
        "id": "lesson-05-section-17",
        "label": "学习记录"
      },
      {
        "id": "lesson-05-section-19",
        "label": "有价值问答"
      },
      {
        "id": "lesson-05-section-20",
        "label": "课后复盘"
      }
    ],
    "html": "<h1 id=\"lesson-05-document-title\">第 05 课：线程池、异步任务与虚拟线程</h1>\n<blockquote>状态：未开始<span class=\"md-quote-break\" aria-hidden=\"true\"></span>建议用时：2 × 90 分钟<span class=\"md-quote-break\" aria-hidden=\"true\"></span>学习页面：<a href=\"https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=05\" target=\"_blank\" rel=\"noreferrer\">打开第 05 课</a></blockquote>\n<p>这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。独立的 <code>course05</code> 主源码形成一条任务执行主线：任务如何被接纳、在哪里等待、由谁执行、怎样 返回结果、如何共享超时，以及平台线程和虚拟线程怎样选。</p>\n<h2 id=\"lesson-05-section-1\">Todo</h2>\n<ul><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>读完本课讲义并能写出线程池接纳顺序</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>播放线程池动画并解释 Worker、workQueue 和拒绝</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>阅读并运行线程池、Future、CompletableFuture 和虚拟线程源码</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>重写 <code>Course05Exercise</code> 并通过测试</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>不看答案口述三道面试题</li></ul>\n<h2 id=\"lesson-05-section-2\">正确学习路径</h2>\n<ol><li>先掌握 <code>ThreadPoolExecutor.execute</code> 的四条接纳路径。</li><li>再学习 Future 的完成、异常、取消和总截止时间。</li><li>再学习 CompletableFuture 的依赖图与执行线程。</li><li>再区分普通线程池、ForkJoinPool 和虚拟线程的任务模型。</li><li>最后把执行载体与数据库、连接池、下游等真实资源容量分开。</li></ol>\n<h2 id=\"lesson-05-section-3\">只记三句话</h2>\n<ol><li>线程池接纳顺序是：核心 Worker、入队、非核心 Worker、拒绝。</li><li>多个 Future 必须共享同一个总 deadline，否则逐个等待会累加总延迟。</li><li>虚拟线程降低线程成本，但不会增加数据库连接数或下游容量。</li></ol>\n<p>选型口诀：</p>\n<pre data-language=\"text\"><code>少量长期 CPU 计算                  → 有界平台线程池\n可拆分递归 CPU 任务                → ForkJoinPool\n大量独立阻塞 I/O                   → 每任务一个虚拟线程\n多个异步结果组合                   → CompletableFuture\n任何外部稀缺资源                   → 单独 Semaphore / 连接池限流</code></pre>\n<h2 id=\"lesson-05-section-4\">ThreadPoolExecutor 接纳路径</h2>\n<p><code>execute(task)</code> 的主流程可以压缩为：</p>\n<pre data-language=\"text\"><code>如果 workerCount &lt; corePoolSize\n    创建核心 Worker(task)\n否则如果 workQueue.offer(task) 成功\n    任务入队，并重新检查线程池状态\n否则如果 workerCount &lt; maximumPoolSize\n    创建非核心 Worker(task)\n否则\n    执行拒绝策略</code></pre>\n<p>队列类型会改变扩容行为：</p>\n<ul><li>无界队列通常会一直入队，使 <code>maximumPoolSize</code> 很难生效。</li><li>小型有界队列更早触发扩容和拒绝，容量边界清晰。</li><li><code>SynchronousQueue</code> 不保存任务，必须直接交给 Worker。</li></ul>\n<p>线程数不是越多越好。CPU 密集任务受核心数限制；阻塞任务还要考虑连接池、 下游并发、上下文切换、队列延迟和内存占用。</p>\n<h2 id=\"lesson-05-section-5\">Worker、ctl 与拒绝</h2>\n<p>ThreadPoolExecutor 需要同时维护运行状态和 Worker 数量。网页中把 <code>ctl</code> 逻辑拆成两个可读字段：</p>\n<pre data-language=\"text\"><code>runState    RUNNING / SHUTDOWN / STOP / TIDYING / TERMINATED\nworkerCount 当前 Worker 数量</code></pre>\n<p>Worker 对象、Worker 集合和 workQueue 属于堆对象状态；每个 Worker 绑定 的线程拥有独立调用栈。</p>\n<p>拒绝不是异常设计失败，而是容量边界的输出信号。常见策略：</p>\n<ul><li>AbortPolicy：抛 <code>RejectedExecutionException</code>。</li><li>CallerRunsPolicy：由提交线程执行，形成自然反压。</li><li>DiscardPolicy：静默丢弃，通常需要额外监控。</li><li>DiscardOldestPolicy：丢最旧队列任务，必须确认业务允许。</li></ul>\n<p>生产代码应记录 submitted、active、queue size、completed、rejected 和任务 耗时，不能只看线程池是否还活着。</p>\n<h2 id=\"lesson-05-section-6\">Future、超时与取消</h2>\n<p><code>execute</code> 只提交 Runnable；<code>submit</code> 返回 Future。Future 需要区分：</p>\n<ul><li>正常完成并携带结果。</li><li>任务抛异常，由 <code>get()</code> 包装为 <code>ExecutionException</code>。</li><li>被取消，<code>get()</code> 抛 <code>CancellationException</code>。</li><li>等待超时，调用者决定是否继续、取消或降级。</li></ul>\n<p>多个任务不能这样等待：</p>\n<pre data-language=\"java\"><code>futureA.get(500, MILLISECONDS);\nfutureB.get(500, MILLISECONDS);\nfutureC.get(500, MILLISECONDS);</code></pre>\n<p>最坏总等待可能接近 1500ms。正确方法是在入口计算一次绝对 deadline， 每次 <code>get</code> 都使用剩余预算。</p>\n<p><code>cancel(true)</code> 只是尝试中断正在运行的任务。任务是否快速结束仍取决于 中断协议、底层调用是否可取消以及业务清理代码。</p>\n<h2 id=\"lesson-05-section-7\">CompletableFuture 编排</h2>\n<p>CompletableFuture 表达的是依赖图：</p>\n<pre data-language=\"text\"><code>thenApply     对一个结果做同步转换\nthenCompose   前一步返回另一个异步阶段，展开嵌套\nthenCombine   两个独立阶段都完成后组合\nallOf         等待多个阶段完成，本身不收集每个结果\nhandle        同时处理成功值和失败\nexceptionally 只处理失败并提供替代值</code></pre>\n<p>不带 <code>Async</code> 的后续阶段通常可能由完成前一步的线程执行；带 <code>Async</code> 的 阶段使用指定 Executor，未指定时通常进入公共池。生产代码应显式决定：</p>\n<ul><li>哪个 Executor 执行阻塞任务。</li><li>哪个 Executor 执行 CPU 转换。</li><li>超时和异常怎样映射成业务 Outcome。</li><li>MDC、Trace、租户等上下文怎样传递。</li></ul>\n<p>不要在公共 ForkJoinPool 中执行不可控的长阻塞调用。</p>\n<h2 id=\"lesson-05-section-8\">ForkJoinPool 与任务模型</h2>\n<p>ForkJoinPool 适合可递归拆分、子任务相对短小的 CPU 计算。Worker 优先 处理自己的双端队列，空闲 Worker 从其他队列窃取任务。</p>\n<p>典型递归结构：</p>\n<pre data-language=\"text\"><code>任务足够小 → 直接 compute\n任务较大   → 拆成 left/right\n             fork 一个分支\n             当前线程 compute 另一个分支\n             join 并合并</code></pre>\n<p>阈值过小会产生大量任务管理开销，过大则并行度不足。阻塞操作需要 <code>ManagedBlocker</code> 或改用更适合阻塞 I/O 的执行模型。</p>\n<h2 id=\"lesson-05-section-9\">虚拟线程</h2>\n<p>虚拟线程适合大量独立的阻塞式 I/O，让代码保持“一任务一线程”的直线 结构。它不适合通过线程池限制任务数量，因为虚拟线程本身就是廉价的执行 载体。</p>\n<p>正确拆分：</p>\n<pre data-language=\"text\"><code>任务并发与代码结构        → 虚拟线程\n数据库连接容量            → 连接池\n下游同时请求数            → Semaphore\n整组等待时间              → deadline</code></pre>\n<p>需要关注：</p>\n<ul><li>长时间 CPU 计算不会因为换成虚拟线程而变快。</li><li>特定同步或本地调用可能导致 carrier pinning，应通过 JFR 和运行数据判断。</li><li>大量 ThreadLocal 数据会按虚拟线程数量放大内存。</li><li>虚拟线程仍需要明确取消、结果和关闭协议。</li></ul>\n<h2 id=\"lesson-05-section-10\">动画阅读方法</h2>\n<p>网页动画使用 <code>core=1、max=2、queue=1</code> 的确定性场景：</p>\n<ol><li>创建空线程池。</li><li>T1 创建核心 Worker-1。</li><li>T2 进入唯一的队列槽位。</li><li>T3 因队列已满而创建非核心 Worker-2。</li><li>T4 因 Worker 与队列都达到上限而被拒绝。</li><li>阻塞任务释放后，某个空闲 Worker 取出 T2。</li><li><code>shutdown</code> 后已接纳任务完成，Worker 退出。</li></ol>\n<p>第六步由哪个 Worker 取得 T2 取决于调度，动画展示的是一种合法时序， 不是唯一顺序。</p>\n<h2 id=\"lesson-05-section-11\">源码学习顺序</h2>\n<ol><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/ThreadPoolDecisionLab.java\" target=\"_blank\" rel=\"noreferrer\">ThreadPoolDecisionLab.java</a>：确定性走过核心、入队、扩容和拒绝。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/DeadlineRunner.java\" target=\"_blank\" rel=\"noreferrer\">DeadlineRunner.java</a>：Future 超时与取消。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/AsyncAggregator.java\" target=\"_blank\" rel=\"noreferrer\">AsyncAggregator.java</a>：CompletableFuture 结果与异常归一化。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/VirtualThreadLab.java\" target=\"_blank\" rel=\"noreferrer\">VirtualThreadLab.java</a>：每任务一个虚拟线程，资源许可独立限流。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/Course05Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course05Exercise.java</a>：显式配置有界执行器。</li></ol>\n<p>运行本课：</p>\n<pre data-language=\"bash\"><code>mvn -q -DskipTests package\njava -cp target/classes com.caesaemc.juc.course05.Course05Application</code></pre>\n<h2 id=\"lesson-05-section-12\">一个练习</h2>\n<p>目标：完成一个具备容量边界、命名线程和明确拒绝策略的线程池配置。</p>\n<p>修改 <a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course05/Course05Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course05Exercise.java</a>， 不要使用无界队列和默认线程名。</p>\n<pre data-language=\"bash\"><code>mvn -q -Dtest=Course05ExerciseTest test</code></pre>\n<p>完成后能解释：为什么队列容量会影响 <code>maximumPoolSize</code> 是否生效，以及 拒绝策略怎样成为系统背压协议的一部分。</p>\n<h2 id=\"lesson-05-section-13\">三道面试题</h2>\n<h3 id=\"lesson-05-section-14\">1. ThreadPoolExecutor 提交任务的顺序是什么？</h3>\n<p>先尝试创建核心 Worker，再尝试入队；入队失败后尝试创建非核心 Worker； 达到最大线程数后执行拒绝策略。</p>\n<h3 id=\"lesson-05-section-15\">2. 多个 Future 为什么应该共享总 deadline？</h3>\n<p>如果每个 Future 都重新等待完整 timeout，总延迟会按 Future 数量累加。 共享 deadline 能让所有等待共同受调用方的总时间预算约束。</p>\n<h3 id=\"lesson-05-section-16\">3. 使用虚拟线程后为什么仍然需要限流？</h3>\n<p>虚拟线程只降低线程创建和阻塞成本。数据库连接、文件描述符、远程服务和 其他真实资源容量没有增加，仍需连接池或 Semaphore 等机制保护。</p>\n<h2 id=\"lesson-05-section-17\">学习记录</h2>\n<h3 id=\"lesson-05-section-18\">2026-07-30：建立第五课独立源码</h3>\n<ul><li><code>course05</code> 统一承载“线程池接纳 → Future → 异步编排 → 虚拟线程”的学习主线。</li><li>网页动画以 <code>ThreadPoolDecisionLab</code> 的容量配置为依据。</li><li>下一步：不看讲义先写出 execute 的四条分支，再用动画核对。</li></ul>\n<h2 id=\"lesson-05-section-19\">有价值问答</h2>\n<ul><li>问题：</li><li>当时怎么想：</li><li>正确结论：</li><li>代码或实验依据：</li><li>一句话面试回答：</li></ul>\n<h2 id=\"lesson-05-section-20\">课后复盘</h2>\n<ul><li>我已经掌握：</li><li>我仍然容易混淆：</li><li>我能否根据任务类型选择执行模型：</li><li>一周后需要重新回答的问题：</li></ul>"
  },
  "06": {
    "number": "06",
    "title": "第 06 课：可靠性、排障与综合项目",
    "sourcePath": "docs/learning-journal/lesson-06.md",
    "sourceUrl": "https://github.com/caesaemc/JucCoreImp/blob/main/docs/learning-journal/lesson-06.md",
    "contentHash": "abf621a163a79ce4acd5ba3847cb19b2fa2f8fb0403377076548555876a21c9d",
    "headings": [
      {
        "id": "lesson-06-section-1",
        "label": "Todo"
      },
      {
        "id": "lesson-06-section-2",
        "label": "正确学习路径"
      },
      {
        "id": "lesson-06-section-3",
        "label": "只记三句话"
      },
      {
        "id": "lesson-06-section-4",
        "label": "从不变量开始设计"
      },
      {
        "id": "lesson-06-section-5",
        "label": "Timeout 与 Deadline"
      },
      {
        "id": "lesson-06-section-6",
        "label": "Bulkhead 与容量"
      },
      {
        "id": "lesson-06-section-7",
        "label": "Future 取消与终态"
      },
      {
        "id": "lesson-06-section-8",
        "label": "部分结果与降级"
      },
      {
        "id": "lesson-06-section-9",
        "label": "并发测试与诊断"
      },
      {
        "id": "lesson-06-section-10",
        "label": "综合聚合服务"
      },
      {
        "id": "lesson-06-section-11",
        "label": "动画阅读方法"
      },
      {
        "id": "lesson-06-section-12",
        "label": "源码学习顺序"
      },
      {
        "id": "lesson-06-section-13",
        "label": "一个练习"
      },
      {
        "id": "lesson-06-section-14",
        "label": "三道面试题"
      },
      {
        "id": "lesson-06-section-18",
        "label": "学习记录"
      },
      {
        "id": "lesson-06-section-20",
        "label": "有价值问答"
      },
      {
        "id": "lesson-06-section-21",
        "label": "课后复盘"
      }
    ],
    "html": "<h1 id=\"lesson-06-document-title\">第 06 课：可靠性、排障与综合项目</h1>\n<blockquote>状态：未开始<span class=\"md-quote-break\" aria-hidden=\"true\"></span>建议用时：2 × 90 分钟<span class=\"md-quote-break\" aria-hidden=\"true\"></span>学习页面：<a href=\"https://juc-core-lab-caesaemc.sappy-lemon-5907.chatgpt.site?lesson=06\" target=\"_blank\" rel=\"noreferrer\">打开第 06 课</a></blockquote>\n<p>这份文件是本课唯一讲义，同时记录学习进度、问题和复盘。独立的 <code>course06</code> 主源码构成最终实战：为多下游聚合请求建立容量、时间、取消和结果边界， 再用可重复测试、线程转储、指标和 JFR 证明系统行为。</p>\n<h2 id=\"lesson-06-section-1\">Todo</h2>\n<ul><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>读完本课讲义并写出四类系统边界</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>播放聚合动画并解释 deadline、permit、Future 和 outcomes[]</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>阅读并运行可靠性、诊断与综合项目源码</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>重写 <code>Course06Exercise</code> 并通过测试</li><li class=\"md-task\"><span class=\"md-checkbox\" aria-hidden=\"true\"></span>不看答案口述三道面试题</li></ul>\n<h2 id=\"lesson-06-section-2\">正确学习路径</h2>\n<ol><li>先定义容量边界：入口、线程、队列、下游并发分别允许多少。</li><li>再定义时间边界：总 deadline 与单下游 timeout 怎样共同生效。</li><li>再定义结果协议：成功、失败、超时、拒绝和取消怎样区分。</li><li>再定义降级规则：哪些失败可以返回部分结果，哪些必须整体失败。</li><li>最后用测试、线程 dump、指标和 JFR 验证设计。</li></ol>\n<h2 id=\"lesson-06-section-3\">只记三句话</h2>\n<ol><li>入口并发、排队长度、下游许可和等待时间都必须有明确上限。</li><li>超时、取消、拒绝和业务失败是不同终态，必须分别记录和处理。</li><li>排障先取得线程状态和调用指标证据，再讨论加线程或换并发工具。</li></ol>\n<p>可靠性检查口诀：</p>\n<pre data-language=\"text\"><code>请求能进入多少                  → 入口并发上限\n任务能排队多少                  → 有界队列\n下游能同时调用多少              → Semaphore / 连接池\n整条请求最多多久                → overall deadline\n单个下游最多多久                → per-call timeout\n失败后返回什么                  → Outcome + 降级协议\n怎样证明问题                    → 可重复测试 + dump + metrics + JFR</code></pre>\n<h2 id=\"lesson-06-section-4\">从不变量开始设计</h2>\n<p>在选择锁、线程池或虚拟线程前，先写出系统不变量：</p>\n<ul><li>同一个请求只有一个总截止时间。</li><li>每个下游调用最多进入一个终态。</li><li>任何路径都不能泄漏 Semaphore 许可。</li><li>结果顺序与调用输入顺序稳定，不依赖完成顺序。</li><li>队列、线程和在途调用数量都不能无限增长。</li><li>关闭时不再接收新任务，并处理已接纳任务。</li></ul>\n<p>并发工具只是实现这些不变量的手段。</p>\n<h2 id=\"lesson-06-section-5\">Timeout 与 Deadline</h2>\n<p>timeout 表示“从现在开始最多等待多久”；deadline 表示“整条操作必须在 哪个绝对时刻前结束”。</p>\n<p>错误做法是每一步重新使用完整 timeout：</p>\n<pre data-language=\"text\"><code>获取许可等待 500ms\n下游 A 再等待 500ms\n下游 B 再等待 500ms</code></pre>\n<p>这样总时间会不断累加。正确做法是在入口计算一次 deadline：</p>\n<pre data-language=\"java\"><code>DeadlineBudget budget = DeadlineBudget.after(overallTimeout);\nlong remaining = budget.remainingNanos();\nfuture.get(remaining, NANOSECONDS);</code></pre>\n<p>单下游限制应与总剩余预算取最小值：</p>\n<pre data-language=\"text\"><code>effectiveTimeout = min(call.timeout, budget.remaining)</code></pre>\n<p>应使用 <code>System.nanoTime()</code> 这类单调时间源计算耗时和剩余预算，不使用会 发生墙上时间跳变的日期时间。</p>\n<h2 id=\"lesson-06-section-6\">Bulkhead 与容量</h2>\n<p>Bulkhead 把一个下游或资源池的故障隔离在自己的容量内。项目使用公平 Semaphore 表达真实资源并发：</p>\n<pre data-language=\"java\"><code>permits.acquire();\ntry {\n    return action.call();\n} finally {\n    permits.release();\n}</code></pre>\n<p>许可必须在 <code>finally</code> 中释放。只有成功获得许可后才能进入释放逻辑，否则 可能错误增加许可数量。</p>\n<p>虚拟线程可以让大量任务等待，但不能代替 Bulkhead。执行线程是承载任务 的机制，许可才表达数据库、连接、远程系统等真实容量。</p>\n<p>队列与 Semaphore 解决不同问题：</p>\n<ul><li>队列限制等待执行的任务数量和内存。</li><li>Semaphore 限制已经进入关键资源的在途数量。</li></ul>\n<h2 id=\"lesson-06-section-7\">Future 取消与终态</h2>\n<p>一个下游调用至少应区分：</p>\n<pre data-language=\"text\"><code>SUCCESS    正常返回值\nFAILED     业务或执行异常\nTIMED_OUT  超过时间预算\nREJECTED   提交时容量已满\nCANCELLED  上游中断或主动取消</code></pre>\n<p><code>future.cancel(true)</code> 只尝试中断任务。调用方仍要：</p>\n<ul><li>记录是超时触发还是外部取消。</li><li>避免同一个调用被重复计数。</li><li>取消对应定时器。</li><li>释放已经取得的许可。</li><li>保留可定位的失败类型和耗时。</li></ul>\n<p>终态记录可使用一次性 CAS 标志，防止 worker 完成和 timeout scheduler 同时记录同一调用。</p>\n<h2 id=\"lesson-06-section-8\">部分结果与降级</h2>\n<p>降级不是“catch 住所有异常继续返回”。它是业务协议：</p>\n<ul><li>关键下游失败：可能整体失败。</li><li>非关键下游失败：保留成功值并标记 degraded。</li><li>超时：明确记录 <code>TIMED_OUT</code>，不能伪装成空数据。</li><li>拒绝：说明系统已经达到容量边界，应快速失败或使用约定 fallback。</li></ul>\n<p><code>AggregationResponse</code> 同时携带：</p>\n<ul><li>按输入顺序排列的每个 <code>CallOutcome</code>。</li><li>成功值集合。</li><li>是否 degraded。</li><li>是否存在关键失败。</li><li>整体耗时。</li></ul>\n<p>这样调用方和监控系统读取的是同一份事实。</p>\n<h2 id=\"lesson-06-section-9\">并发测试与诊断</h2>\n<p>不能用一次随机运行证明并发代码正确。测试应尽量控制时序：</p>\n<ul><li>CountDownLatch：让多个 actor 准备完成后同时开始。</li><li>CyclicBarrier：控制多阶段交错。</li><li>阻塞桩：稳定制造线程池饱和或队列堆积。</li><li>共享 deadline：测试失败时取消其他 actor，避免测试挂死。</li></ul>\n<p>不同工具回答不同问题：</p>\n<pre data-language=\"text\"><code>JUnit         → 业务行为和边界条件\njcstress      → Java 内存模型允许哪些结果\nJMH           → 稳态吞吐和延迟比较\n线程 dump     → 某一时刻线程卡在哪里\nJFR           → 一段时间内 CPU、锁、分配、阻塞和线程事件\n指标          → 线上趋势、容量和终态分布</code></pre>\n<p>线上吞吐下降时，先抓线程 dump：</p>\n<ul><li>RUNNABLE 很多：检查 CPU 热点、忙等和系统调用。</li><li>BLOCKED 很多：检查共同监视器和锁竞争。</li><li>WAITING/TIMED_WAITING 很多：检查队列、Condition、Future 和下游等待。</li><li>线程池 active 已满且 queue 持续增长：检查慢任务和容量配置。</li></ul>\n<p>不要看到线程多就直接增加线程数。必须先确认瓶颈位于 CPU、锁、队列还是 外部依赖。</p>\n<h2 id=\"lesson-06-section-10\">综合聚合服务</h2>\n<p>项目的聚合服务把前五课能力组合在一起：</p>\n<ol><li>请求线程创建一个 <code>DeadlineBudget</code>。</li><li>每个 DownstreamCall 被提交为 Future。</li><li>timeout scheduler 为每个调用安排取消任务。</li><li>worker 获取共享 Semaphore 许可后才能访问下游。</li><li>调用完成后在 <code>finally</code> 中归还许可。</li><li>调用结果按原索引写入 <code>outcomes[]</code>。</li><li>聚合器返回完整或降级的 <code>AggregationResponse</code>。</li><li>关闭流程拒绝新请求，等待或取消已接纳任务。</li></ol>\n<p>平台线程实现使用固定 Worker 和有界队列；虚拟线程实现每调用一个虚拟 线程。两种执行模型共享相同的 deadline、许可、结果和指标协议。</p>\n<h2 id=\"lesson-06-section-11\">动画阅读方法</h2>\n<p>网页动画展示 capacity=2、overall deadline=800ms 的教学场景：</p>\n<ol><li>请求创建总预算和固定长度 <code>outcomes[]</code>。</li><li>三个调用建立 Future 和超时定时器。</li><li>profile、inventory 获得两个许可，recommendation 等待。</li><li>profile 成功并归还许可，recommendation 开始。</li><li>inventory 超时，Future 被取消并释放许可。</li><li>recommendation 成功，所有许可归还。</li><li>聚合器返回 <code>PARTIAL · degraded=true</code>，并记录成功与超时指标。</li></ol>\n<p>每一步核对剩余预算、availablePermits、activeCalls、任务状态和 <code>outcomes[]</code>。</p>\n<h2 id=\"lesson-06-section-12\">源码学习顺序</h2>\n<ol><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/DeadlineBudget.java\" target=\"_blank\" rel=\"noreferrer\">DeadlineBudget.java</a>：一次建立总截止时间。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/ConcurrentTestHarness.java\" target=\"_blank\" rel=\"noreferrer\">ConcurrentTestHarness.java</a>：可控并发测试和失败取消。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/ReliableAggregator.java\" target=\"_blank\" rel=\"noreferrer\">ReliableAggregator.java</a>：提交、限流、超时、取消、终态和有序收集。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/AggregationStrategies.java\" target=\"_blank\" rel=\"noreferrer\">AggregationStrategies.java</a>：有界平台线程池和虚拟线程策略。</li><li><a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/Course06Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course06Exercise.java</a>：限时 Bulkhead 练习。</li></ol>\n<p>运行本课：</p>\n<pre data-language=\"bash\"><code>mvn -q -DskipTests package\njava -cp target/classes com.caesaemc.juc.course06.Course06Application</code></pre>\n<h2 id=\"lesson-06-section-13\">一个练习</h2>\n<p>目标：实现一个具备公平许可、限时等待、超时 fallback 和异常安全释放的 Bulkhead。</p>\n<p>修改 <a href=\"https://github.com/caesaemc/JucCoreImp/blob/main/src/main/java/com/caesaemc/juc/course06/Course06Exercise.java\" target=\"_blank\" rel=\"noreferrer\">Course06Exercise.java</a>。</p>\n<pre data-language=\"bash\"><code>mvn -q -Dtest=Course06ExerciseTest test</code></pre>\n<p>完成后能证明：许可不会在正常、受检异常、运行时异常或中断路径泄漏， 等待超时时不会执行真实下游调用。</p>\n<h2 id=\"lesson-06-section-14\">三道面试题</h2>\n<h3 id=\"lesson-06-section-15\">1. 为什么队列、并发数和等待时间都要有上限？</h3>\n<p>它们分别控制排队内存、真实资源压力和尾延迟。任何一个无限增长，都可能 让局部过载扩散为整个系统不可用。</p>\n<h3 id=\"lesson-06-section-16\">2. 线上线程很多但吞吐下降，第一步看什么？</h3>\n<p>先抓线程 dump，观察线程状态分布和共同调用栈，再结合线程池、队列、下游 耗时和终态指标判断瓶颈；不要先假设需要增加线程。</p>\n<h3 id=\"lesson-06-section-17\">3. 平台线程池和虚拟线程怎样选择？</h3>\n<p>根据任务是 CPU 计算还是大量阻塞 I/O、运行环境和观测数据选择。两者都 必须共享明确的资源限流、deadline、取消、结果和关闭协议。</p>\n<h2 id=\"lesson-06-section-18\">学习记录</h2>\n<h3 id=\"lesson-06-section-19\">2026-07-30：建立第六课独立源码</h3>\n<ul><li><code>course06</code> 统一承载“边界 → deadline → bulkhead → 结果协议 → 证据”。</li><li>网页动画用一次部分成功的聚合请求串联容量、超时、取消和降级。</li><li>下一步：先手写系统边界清单，再阅读 <code>DeadlineBudget</code>。</li></ul>\n<h2 id=\"lesson-06-section-20\">有价值问答</h2>\n<ul><li>问题：</li><li>当时怎么想：</li><li>正确结论：</li><li>代码或实验依据：</li><li>一句话面试回答：</li></ul>\n<h2 id=\"lesson-06-section-21\">课后复盘</h2>\n<ul><li>我已经掌握：</li><li>我仍然容易混淆：</li><li>我能否解释每一层容量和时间边界：</li><li>一周后需要重新回答的问题：</li></ul>"
  }
} as const satisfies Record<string, LessonNote>;

export function getLessonNote(number: string): LessonNote | undefined {
  return lessonNotes[number as keyof typeof lessonNotes];
}
