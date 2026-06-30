# 小学初中英语拆句填空练习网站

基于需求文档 `junior-english-quiz-spec.md` 搭建的 Next.js 14 (App Router) 项目。
面向 **小学六年级 ~ 初中（Grade 6–9）**。
当前为 **mock-data-first** 阶段：未接入 Supabase，题库与会话走本地内存 / IndexedDB，可直接运行体验完整答题流程。

## 快速开始

```bash
npm install
cp .env.example .env.local   # 可留空，默认走 mock 数据
npm run dev                  # http://localhost:3000 → 自动跳转 /practice
```

## 已实现（脚手架）

- 学生端答题页 `/practice`：题目展示、填空框、提交批改、跳题、轻/全提示、音频朗读（Web Speech 降级）、键盘快捷键、暂停/重置、进度条
- 练习报告页 `/report/[sessionId]`
- 后台 `/admin`：题库列表、题目编辑表单 + 填空框拆分编辑器、CSV 批量导入（解析预览）
- API Routes：`/api/questions`、`/api/topics`、`/api/sessions`、`/api/answers`、`/api/hints/*`、`/api/audio/generate`
- 数据层抽象 `lib/data/repository.ts`（mock 实现，预留 Supabase 切换）
- IndexedDB 本地缓存、Zustand 状态管理、Howler 音频

## 目录结构

见需求文档 §3。核心：`app/`（路由）、`components/`、`hooks/`、`lib/`、`types/`。

## 切换到 Supabase（后续）

1. 创建 Supabase 项目，执行文档 §2 的建表 SQL 与 RLS。
2. 填写 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`，设 `DATA_SOURCE=supabase`。
3. 在 `lib/data/repository.ts` 实现 `supabaseRepository` 并在工厂中返回。

## eng.pdf 词库导入（后续）

`eng.pdf` 为译林版小学《英语·六年级上册》教材（非整齐的中英句对照），
导入前需自定义解析。解析脚本将放在 `scripts/`（待办）。
