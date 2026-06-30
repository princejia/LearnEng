# 小学初中英语拆句填空练习网站
## 极简开发需求文档 · Next.js + Supabase + Vercel

> **技术栈**：Next.js 14 (App Router) · Supabase (DB + Auth + Storage) · Vercel (部署 + Edge)  
> **目标用户**：小学六年级 ~ 初中生（Grade 6–9）  
> **访问方式**：浏览器直接打开，无需安装任何客户端

---

## 目录

1. [技术架构总览](#1-技术架构总览)
2. [数据库设计](#2-数据库设计)
3. [项目目录结构](#3-项目目录结构)
4. [顶部导航栏](#4-顶部导航栏)
5. [主答题页面](#5-主答题页面)
6. [底部快捷键栏](#6-底部快捷键栏)
7. [数据与进度存储](#7-数据与进度存储)
8. [后台管理端](#8-后台管理端)
9. [音频系统](#9-音频系统)
10. [API 路由设计](#10-api-路由设计)
11. [响应式与性能要求](#11-响应式与性能要求)
12. [可选后续迭代](#12-可选后续迭代)
13. [开发阶段划分](#13-开发阶段划分)

---

## 1. 技术架构总览

```
┌─────────────────────────────────────────────────┐
│                   Vercel Edge                   │
│  ┌─────────────────────────────────────────┐    │
│  │           Next.js 14 App Router         │    │
│  │  /app         → 学生前端                 │    │
│  │  /app/admin   → 后台管理端               │    │
│  │  /app/api     → API Routes (Edge Fn)    │    │
│  └───────────────────┬─────────────────────┘    │
└──────────────────────┼──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │        Supabase         │
          │  PostgreSQL  (题库/进度) │
          │  Auth        (账号登录)  │
          │  Storage     (音频文件)  │
          │  Realtime    (可选同步)  │
          └─────────────────────────┘
```

### 核心依赖

| 包 | 用途 |
|---|---|
| `next` 14 | 框架，App Router + Server Components |
| `@supabase/ssr` | Supabase SSR 客户端 |
| `zustand` | 前端状态管理（答题进度） |
| `idb-keyval` | IndexedDB 本地缓存封装 |
| `howler` | 音频播放（跨浏览器兼容） |
| `tailwindcss` | 样式 |
| `shadcn/ui` | UI 组件库 |
| `@tanstack/react-table` | 后台题库管理表格 |
| `zod` | 接口参数校验 |

---

## 2. 数据库设计

> **实现状态**：项目采用「mock 优先」架构，数据访问统一走 `lib/data/repository.ts` 的 `Repository` 接口。
> - `DATA_SOURCE=mock`（缺省）：使用内存 mock 题库，无需任何后端即可运行。
> - `DATA_SOURCE=supabase` 且配置好三项环境变量：自动切换到 `supabaseRepository`（`lib/data/supabase-repository.ts`）。
>
> **接入 Supabase 步骤**：
> 1. 在 Supabase 控制台 → SQL Editor 执行 `supabase/schema.sql`（建表 + RLS + 话题种子）。
> 2. 把 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` 填入 `.env.local`，并将 `DATA_SOURCE` 改为 `supabase`。
> 3. 启动后 `POST /api/admin/seed` 把示例题库导入数据库（幂等，可重复执行）。
>
> 服务端通过 Service Role Key 访问（绕过 RLS），以支持游客练习流程。

> **词库导入（eng.pdf）**：译林版六年级上册课本的「Word lists 生词表」是现成的中英对照词库（英文词/短语 + 中文释义 + 单元）。
> - `scripts/extract_pdf.py`：抽取课文英文句子（备用）。
> - `scripts/parse_wordlist.py`：解析「按单元」生词表 → `scripts/eng-words.json`（158 条，覆盖 Unit 1–8）。
> - `POST /api/admin/import-words`：把 `eng-words.json` 导入 Supabase，生成「看中文释义→拼英文单词/短语」的填空题（全挖空，确定性 id 幂等可重导）。

### 2.1 题库相关表

```sql
-- 题目主表
CREATE TABLE questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chinese     text NOT NULL,                  -- 中文句子
  english     text NOT NULL,                  -- 完整英文句子
  audio_url   text,                           -- Supabase Storage 音频地址
  grade       smallint NOT NULL,              -- 年级 6/7/8/9
  unit        smallint,                       -- 单元编号
  topic       text,                           -- 话题标签（如 "family", "travel"）
  difficulty  smallint DEFAULT 1,             -- 1=基础 2=进阶
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 填空框配置表（一题对应多个填空框）
CREATE TABLE question_blanks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   uuid REFERENCES questions(id) ON DELETE CASCADE,
  blank_index   smallint NOT NULL,            -- 填空框顺序（从0开始）
  answer        text NOT NULL,               -- 标准答案（单词）
  display_order smallint NOT NULL            -- 展示顺序
);

-- 话题标签表
CREATE TABLE topics (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE,               -- 英文key
  label text NOT NULL                       -- 中文显示名
);
```

### 2.2 用户进度相关表

```sql
-- 练习会话表
CREATE TABLE practice_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id),  -- null = 游客（走本地缓存）
  filter_grade smallint,
  filter_unit  smallint,
  filter_topic text,
  mode         text DEFAULT 'fill_blank',        -- fill_blank / dictation / translate
  started_at   timestamptz DEFAULT now(),
  finished_at  timestamptz,
  total_count  int,
  correct_count int DEFAULT 0
);

-- 答题记录表
CREATE TABLE answer_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id   uuid REFERENCES questions(id),
  user_answer   text[],                     -- 每个填空框的作答
  is_correct    boolean,
  hint_used     boolean DEFAULT false,      -- 是否用过提示
  marked_status text DEFAULT 'none',        -- none / mastered / weak
  answered_at   timestamptz DEFAULT now()
);

-- 错题本
CREATE TABLE wrong_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  question_id uuid REFERENCES questions(id),
  count       int DEFAULT 1,               -- 累计答错次数
  last_wrong  timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- 每日提示次数限制（可选）
CREATE TABLE daily_hint_usage (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid REFERENCES auth.users(id),
  date      date DEFAULT CURRENT_DATE,
  used_count int DEFAULT 0,
  UNIQUE(user_id, date)
);
```

### 2.3 RLS 策略

```sql
-- 题库：所有人可读，仅管理员可写
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON questions FOR SELECT USING (true);
CREATE POLICY "admin write" ON questions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- 答题记录：用户只能操作自己的数据
ALTER TABLE answer_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON answer_records FOR ALL
  USING (session_id IN (
    SELECT id FROM practice_sessions WHERE user_id = auth.uid()
  ));
```

---

## 3. 项目目录结构

```
/
├── app/
│   ├── (student)/                    # 学生端路由组
│   │   ├── layout.tsx                # 含顶部导航栏
│   │   ├── page.tsx                  # 首页 → 重定向到 /practice
│   │   ├── practice/
│   │   │   └── page.tsx              # 主答题页
│   │   └── report/
│   │       └── [sessionId]/page.tsx  # 练习报告页
│   ├── (admin)/                      # 后台路由组
│   │   ├── layout.tsx                # 后台布局（需鉴权）
│   │   └── admin/
│   │       ├── questions/page.tsx    # 题库列表
│   │       ├── questions/new/page.tsx
│   │       ├── questions/[id]/page.tsx
│   │       └── import/page.tsx       # 批量导入
│   └── api/
│       ├── questions/route.ts        # 题目 CRUD
│       ├── sessions/route.ts         # 会话管理
│       ├── answers/route.ts          # 答题提交
│       ├── audio/generate/route.ts   # TTS 生成
│       └── hints/route.ts            # 提示次数校验
├── components/
│   ├── nav/
│   │   ├── TopNav.tsx                # 顶部导航栏（5个按钮）
│   │   ├── ContentFilter.tsx         # 学习内容筛选抽屉
│   │   ├── ModeSelector.tsx          # 练习模式选择
│   │   └── ProgressBar.tsx           # 进度条组件
│   ├── practice/
│   │   ├── QuestionCard.tsx          # 题目卡片（中文句子）
│   │   ├── BlankInput.tsx            # 单个填空框
│   │   ├── BlankRow.tsx              # 一行所有填空框
│   │   ├── AudioPlayer.tsx           # 音频播放按钮
│   │   ├── HintButton.tsx            # 提示按钮（轻提示/全提示）
│   │   └── AnswerFeedback.tsx        # 答题反馈（对/错高亮）
│   ├── shortcuts/
│   │   └── ShortcutBar.tsx           # 底部快捷键栏
│   └── admin/
│       ├── QuestionForm.tsx          # 题目编辑表单
│       ├── BlankEditor.tsx           # 填空框拆分编辑器
│       ├── BulkImport.tsx            # 批量导入组件
│       └── AudioManager.tsx          # 音频管理
├── hooks/
│   ├── usePracticeStore.ts           # Zustand 练习状态
│   ├── useKeyboard.ts                # 全局键盘事件
│   ├── useAudio.ts                   # Howler 音频控制
│   ├── useHint.ts                    # 提示逻辑
│   └── useLocalCache.ts              # IndexedDB 本地缓存
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 浏览器端 client
│   │   ├── server.ts                 # 服务端 client
│   │   ├── admin.ts                  # Service Role admin client（绕过 RLS）
│   │   └── middleware.ts             # Auth middleware
│   ├── data/
│   │   ├── repository.ts             # Repository 接口 + mock 实现 + 工厂
│   │   ├── supabase-repository.ts    # Supabase 实现
│   │   ├── builder.ts                # 由英文句子构建题目（tokens/blanks）
│   │   └── mock-questions.ts         # 示例题库
│   ├── tts.ts                        # TTS 生成工具（调用第三方API）
│   └── utils.ts
├── supabase/
│   └── schema.sql                    # 建表 + RLS + 种子（在 SQL Editor 执行）
├── types/
│   └── index.ts                      # 全局 TypeScript 类型
└── middleware.ts                     # Next.js middleware（路由鉴权）
```

---

## 4. 顶部导航栏

**组件**：`components/nav/TopNav.tsx`（固定在顶部，`position: sticky; top: 0`）

### 4.1 五个按钮说明

| # | 按钮名 | 触发行为 |
|---|---|---|
| 1 | 学习内容 | 打开侧边抽屉 `<ContentFilter>`，按年级/单元/话题筛选题库 |
| 2 | 练习模式 | 打开 Modal `<ModeSelector>`，当前仅开放"拆句填空"，其余置灰预留 |
| 3 | 暂停练习 | 切换 `isPaused` 状态；暂停时锁定输入框，保留当前题目及已填内容 |
| 4 | 重置进度 | 弹出确认对话框 → 确认后清空当前 session 所有答题记录，跳回第1题 |
| 5 | 进度条 | 实时显示 `已完成题数 / 总题数` + 正确率百分比，含动画进度条 |

### 4.2 ContentFilter 抽屉结构

```
[ 年级 ]  ○ 六年级  ○ 七年级  ○ 八年级  ○ 九年级
[ 单元 ]  下拉选择（根据年级动态加载）
[ 话题 ]  多选标签（家庭 / 旅行 / 学校 / 科技 ...）
[ 难度 ]  ○ 基础  ○ 进阶
[ 开始练习 ]  → 创建新 session，加载题目
```

### 4.3 ProgressBar 组件

```tsx
// 显示逻辑
const progress = completedCount / totalCount;         // 0.0 ~ 1.0
const accuracy = correctCount / Math.max(answeredCount, 1);

// UI：宽度自适应，颜色随正确率变化
// < 60%: red-400  |  60%~80%: yellow-400  |  > 80%: green-400
```

---

## 5. 主答题页面

**路由**：`/practice`  
**组件**：`app/(student)/practice/page.tsx`

### 5.1 页面布局

```
┌─────────────────────────────────────────┐
│  [TopNav]  固定顶部                       │
├─────────────────────────────────────────┤
│                                         │
│   📋 中文句子（大字体，居中）              │  ← QuestionCard
│                                         │
│   __ __ __ __ __ __ __                  │  ← BlankRow（填空框组）
│                                         │
│   [🔊 朗读]  [💡 轻提示]  [📖 全提示]   │  ← 功能按钮行
│                                         │
│   [← 上一题]                   [→ 下一题] │
│                                         │
├─────────────────────────────────────────┤
│  [ShortcutBar]  固定底部                  │
└─────────────────────────────────────────┘
```

### 5.2 QuestionCard 组件

```tsx
interface QuestionCardProps {
  chinese: string;    // 中文句子
  questionNo: number; // 第几题
  totalCount: number;
}
// 字体大小：移动端 1.25rem，桌面端 1.75rem
// 居中展示，上方显示题号 "第 3 题 / 共 20 题"
```

### 5.3 BlankInput 填空框组件

```tsx
interface BlankInputProps {
  index: number;           // 填空框序号
  answer: string;          // 正确答案（内部存储，不展示）
  status: 'idle' | 'correct' | 'wrong' | 'hinted';
  value: string;
  onChange: (val: string) => void;
  onFocus: () => void;
  onHover: () => void;     // 触发单词朗读
}

// 样式
const statusStyle = {
  idle:    'border-gray-300 bg-white',
  correct: 'border-green-500 bg-green-50 text-green-700',
  wrong:   'border-red-400 bg-red-50 text-red-600',
  hinted:  'border-yellow-400 bg-yellow-50',
};

// 宽度自适应：min-w-[3rem]，根据 answer.length 动态扩展
// 字体：等宽字体（font-mono）
// 自动聚焦到第一个未填写的输入框
```

### 5.4 答题流程

```
用户在输入框输入内容
       ↓
按「空格键」提交
       ↓
逐框比对 answer（大小写不敏感）
       ↓
全对 → 全部变绿 → 延迟 0.8s → 自动切换下一题
       ↓
有错 → 错误框变红 → 保持当前题 → 自动标记为错题
       ↓
用户修改错误框 → 可重复提交
```

### 5.5 提示系统

```tsx
// 轻提示：仅展示首字母
const lightHint = (answer: string) => answer[0] + '_'.repeat(answer.length - 1);
// 示例：answer="beautiful" → "b________"

// 全提示：直接填入完整答案，标记 hinted 状态
const fullHint = (answer: string) => answer;

// 提示次数限制（已登录用户）
// 每日全提示上限：默认 10 次（管理端可配置）
// 超限后全提示按钮置灰，显示"今日提示次数已用完"
```

### 5.6 音频播放逻辑

```tsx
// useAudio hook
const { play, playWord } = useAudio();

// 1. 手动点击朗读按钮 → 播放整句
// 2. 切题时自动播放（可通过设置开关控制）
// 3. hover 单个输入框 0.5s 后 → 朗读该单词
//    移动端：长按触发（无hover）

// 音频来源：Supabase Storage 预生成 MP3
// 降级方案：Web Speech API (speechSynthesis) 在线 TTS
const fallbackTTS = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
};
```

---

## 6. 底部快捷键栏

**组件**：`components/shortcuts/ShortcutBar.tsx`（固定底部）

### 6.1 快捷键映射表

| 按钮/操作 | 快捷键 | 功能 |
|---|---|---|
| 上一题 | 无（仅按钮点击） | 返回上一道题，保留已填内容 |
| 跳格 | `Tab` / `←` `→` 方向键 | 光标在填空框间跳转 |
| 朗读 | `Ctrl + M` | 播放当前句子音频 |
| 标记掌握 | `Ctrl + G` | 标记本题熟练，降低重复频率 |
| 标记不熟悉 | `Ctrl + Q` | 标记薄弱，加入重点复习 |
| 提交 | `空格键` | 提交当前题目所有填空答案 |
| 切题（前） | `Shift + ←` | 快速跳转到上一题 |
| 切题（后） | `Shift + →` | 快速跳转到下一题 |

> **注意**：`空格键` 在「所有输入框已填写」时触发提交，否则在输入框内正常输入空格（实际上英语单词无空格，可直接设为全局提交键）。

### 6.2 useKeyboard Hook 实现思路

```tsx
// hooks/useKeyboard.ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (isPaused) return;

    if (e.code === 'Space' && !isTypingInOtherInput(e.target)) {
      e.preventDefault();
      submitAnswers();
    }
    if (e.ctrlKey && e.key === 'm') { e.preventDefault(); playAudio(); }
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); markMastered(); }
    if (e.ctrlKey && e.key === 'q') { e.preventDefault(); markWeak(); }
    if (e.shiftKey && e.key === 'ArrowRight') { e.preventDefault(); nextQuestion(); }
    if (e.shiftKey && e.key === 'ArrowLeft')  { e.preventDefault(); prevQuestion(); }
    if (e.key === 'Tab') { e.preventDefault(); focusNextBlank(e.shiftKey); }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [isPaused, currentQuestion]);
```

---

## 7. 数据与进度存储

### 7.1 双层缓存策略

```
用户答题
    │
    ├─→ 立即写入 IndexedDB（本地，无需网络）
    │       key: "session_{sessionId}"
    │       value: { answers, currentIndex, markedStatus, ... }
    │
    └─→ 登录用户：防抖 3s 后同步到 Supabase
            POST /api/answers
```

### 7.2 IndexedDB 本地缓存结构（useLocalCache）

```typescript
// idb-keyval 封装
interface LocalSession {
  sessionId: string;
  filter: { grade?: number; unit?: number; topic?: string };
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, {          // key: questionId
    userAnswers: string[];
    isCorrect: boolean;
    hintUsed: boolean;
    markedStatus: 'none' | 'mastered' | 'weak';
  }>;
  lastSaved: number;                 // timestamp
}
```

### 7.3 练习报告

**路由**：`/report/[sessionId]`

```
┌──────────────────────────────┐
│  🎉 练习完成！                  │
│  总题量: 20   答对: 16         │
│  正确率: 80%  用时: 12分钟     │
├──────────────────────────────┤
│  错题清单（4题）                │
│  ① She is going to ... [详情] │
│  ② They have been ...  [详情] │
├──────────────────────────────┤
│  [再练一遍]  [错题专项]  [导出] │
└──────────────────────────────┘
```

---

## 8. 后台管理端

**路由前缀**：`/admin`（需 Supabase Auth `role = 'admin'`）

### 8.1 题库列表页 `/admin/questions`

- 表格展示所有题目（分页，每页 50 条）
- 搜索框：按中文/英文句子模糊搜索
- 筛选：年级 / 单元 / 话题 / 音频状态（有/无）
- 操作：编辑 / 删除 / 生成音频 / 预览

### 8.2 题目编辑表单

```
中文句子：[___________________________]
英文句子：[___________________________]
                    ↓ 点击「自动拆分」
填空框拆分（拖拽调整顺序）：
  □ She   □ is   □ going   □ to   □ school
  可点击每个词的 [x] 取消填空（变为固定展示文字）

年级：[ 六年级 ▼ ]
单元：[ Unit 3 ▼ ]
话题：[ 学校 ] [ 日常生活 ] + 添加
难度：[ 基础 ] [ 进阶 ]

音频：[ 生成音频 ] 或 [ 上传音频文件 ]
     当前：✅ 已有音频 [试听] [重新生成]
```

### 8.3 批量导入 `/admin/import`

**CSV 格式**：

```csv
chinese,english,grade,unit,topic
"她正在去学校的路上","She is on her way to school.",7,3,"school,daily"
"他们已经学习英语三年了","They have been learning English for three years.",8,5,"study"
```

**导入流程**：
1. 上传 CSV 文件
2. 预览解析结果（表格展示，可逐行确认/删除）
3. 点击「确认导入」→ 批量写入数据库
4. 自动按行拆分英文句子生成 `question_blanks`
5. 可选：导入后批量一键生成所有音频

### 8.4 音频批量生成

```typescript
// TTS 服务选型（任选一）
// 优先：微软 Azure TTS（音质好，支持英美发音切换）
// 备选：Google Cloud TTS
// 免费：Web Speech API（仅前端预览用）

// API 路由：POST /api/audio/generate
// Body: { questionId: string, voice: 'en-US' | 'en-GB' }
// 1. 调用 TTS API 获取 MP3 Buffer
// 2. 上传到 Supabase Storage: audio/{questionId}.mp3
// 3. 更新 questions.audio_url
```

---

## 9. 音频系统

### 9.1 Supabase Storage 结构

```
bucket: english-audio/
├── sentences/
│   ├── {questionId}.mp3       # 整句音频
│   └── {questionId}_slow.mp3  # 慢速版本（可选）
└── words/
    └── {word}.mp3             # 单词音频（按需生成）
```

### 9.2 音频 URL 获取

```typescript
// 公开 bucket，直接拼 URL
const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/english-audio/sentences/${questionId}.mp3`;

// 或通过 Supabase SDK
const { data } = supabase.storage.from('english-audio').getPublicUrl(`sentences/${questionId}.mp3`);
```

### 9.3 Howler 播放控制

```typescript
// hooks/useAudio.ts
import { Howl } from 'howler';

const useAudio = () => {
  const soundRef = useRef<Howl | null>(null);

  const play = (url: string) => {
    soundRef.current?.unload();
    soundRef.current = new Howl({ src: [url], html5: true });
    soundRef.current.play();
  };

  const stop = () => soundRef.current?.stop();

  return { play, stop };
};
```

---

## 10. API 路由设计

所有接口使用 Next.js Route Handlers (`app/api/`)，返回 JSON。

### 10.1 题目接口

```
GET  /api/questions
  ?grade=7&unit=3&topic=school&mode=fill_blank&limit=20&shuffle=true
  → { questions: Question[], total: number }

POST /api/questions          (admin)
PUT  /api/questions/[id]     (admin)
DELETE /api/questions/[id]   (admin)
```

### 10.2 会话接口

```
POST /api/sessions
  Body: { grade, unit, topic, mode, questionIds[] }
  → { sessionId: string }

GET  /api/sessions/[id]
  → { session: Session, progress: Progress }

PATCH /api/sessions/[id]
  Body: { finished_at, correct_count }
```

### 10.3 答题接口

```
POST /api/answers
  Body: {
    sessionId: string,
    questionId: string,
    userAnswers: string[],
    isCorrect: boolean,
    hintUsed: boolean,
    markedStatus: 'none' | 'mastered' | 'weak'
  }
  → { success: boolean }
```

### 10.4 提示次数接口

```
GET  /api/hints/remaining
  → { remaining: number, limit: number }

POST /api/hints/use
  Body: { questionId: string }
  → { success: boolean, remaining: number }
```

---

## 11. 响应式与性能要求

### 11.1 断点设计

| 设备 | 宽度 | 适配重点 |
|---|---|---|
| 手机 | < 640px | 填空框自动换行，底部快捷键折叠，字体放大 |
| 平板 | 640–1024px | 两列布局，快捷键展开显示 |
| 桌面 | > 1024px | 完整布局，所有功能展示 |

### 11.2 性能目标

- **首屏加载**：< 2s（LCP，4G 网络）
- **题目切换**：< 100ms（纯前端状态切换）
- **音频首次加载**：< 1.5s（MP3 预加载下一题）
- **离线可用**：题目数据缓存至 IndexedDB 后，断网仍可继续答题

### 11.3 性能优化手段

```typescript
// 1. 题目列表一次性加载，全部存入 Zustand
// 2. 音频预加载：当前题 + 下一题
// 3. Next.js Image 组件（如有图片）
// 4. 路由 prefetch 自动启用
// 5. Supabase query 使用 select 仅取必要字段
const { data } = await supabase
  .from('questions')
  .select('id, chinese, english, audio_url, question_blanks(blank_index, answer, display_order)')
  .eq('grade', 7)
  .limit(20);
```

---

## 12. 可选后续迭代

> 以下功能在 MVP 完成后迭代，不影响核心开发。

### Phase 2

- [ ] **生词本**：自动收纳答错单词，支持复习模式
- [ ] **双难度模式**：进阶模式增加填空数量，减少提示次数

### Phase 3

- [ ] **习题导出 PDF**：使用 `@react-pdf/renderer` 生成可打印格式
- [ ] **班级功能**：教师端创建班级，学生加入，查看全班进度
- [ ] **听写模式**：播放音频，学生听写完整句子
- [ ] **英译中模式**：展示英文，填写中文

---

## 13. 开发阶段划分

### Sprint 1（Week 1–2）：数据库 + 题库管理

- [ ] Supabase 项目初始化，建表，配置 RLS
- [ ] 后台管理端：题目 CRUD、填空框拆分编辑器
- [ ] CSV 批量导入
- [ ] Supabase Storage 配置 + TTS 集成

### Sprint 2（Week 3–4）：核心答题页

- [ ] 题目展示 + 填空框组件
- [ ] 答题逻辑（提交/批改/跳题）
- [ ] 音频播放（Howler + 降级 TTS）
- [ ] 提示系统（轻提示/全提示）
- [ ] IndexedDB 本地缓存

### Sprint 3（Week 5）：导航 + 快捷键 + 进度

- [ ] 顶部导航栏（5个按钮）
- [ ] 全局键盘快捷键
- [ ] 进度条 + 暂停/重置逻辑
- [ ] 练习报告页

### Sprint 4（Week 6）：账号 + 云同步 + 收尾

- [ ] Supabase Auth（邮箱登录/Google OAuth）
- [ ] 云端进度同步（登录用户）
- [ ] 错题本页面
- [ ] 全端响应式适配
- [ ] Vercel 部署 + 环境变量配置
- [ ] 性能优化 + 弱网测试

---

## 环境变量清单

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # 仅服务端使用

# TTS 服务（选一）
AZURE_TTS_KEY=xxx
AZURE_TTS_REGION=eastasia
# 或
GOOGLE_TTS_API_KEY=xxx

# 管理员配置
ADMIN_HINT_DAILY_LIMIT=10          # 每日全提示上限
```

---

*文档版本：v1.0 · 生成日期：2026-06*  
*如需前端页面分层结构文档（组件树 + 状态流转图），可单独输出。*
