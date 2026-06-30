import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_QUESTIONS, MOCK_TOPICS } from "@/lib/data/mock-questions";

/**
 * 将本地 mock 题库写入 Supabase（幂等：按 id upsert）。
 * 用法：配置好 Supabase 环境变量后，POST /api/admin/seed
 * 仅在配置了 Service Role Key 时可用。
 */
export async function POST() {
  const db = createAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase 未配置（缺少 SUPABASE_SERVICE_ROLE_KEY）" },
      { status: 400 },
    );
  }

  // 话题
  const { error: topicErr } = await db.from("topics").upsert(
    MOCK_TOPICS.map((t) => ({ name: t.name, label: t.label })),
    { onConflict: "name" },
  );
  if (topicErr) {
    return NextResponse.json({ error: topicErr.message }, { status: 500 });
  }

  // 题目
  const questionRows = MOCK_QUESTIONS.map((q) => ({
    id: q.id,
    chinese: q.chinese,
    english: q.english,
    audio_url: q.audioUrl ?? null,
    grade: q.grade,
    unit: q.unit ?? null,
    topic: q.topic ?? null,
    difficulty: q.difficulty,
    is_active: q.isActive,
  }));
  const { error: qErr } = await db
    .from("questions")
    .upsert(questionRows, { onConflict: "id" });
  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  // 填空框：先清掉旧的再插入，保证与当前题目一致
  const ids = MOCK_QUESTIONS.map((q) => q.id);
  await db.from("question_blanks").delete().in("question_id", ids);
  const blankRows = MOCK_QUESTIONS.flatMap((q) =>
    q.blanks.map((b) => ({
      question_id: q.id,
      blank_index: b.blankIndex,
      answer: b.answer,
      display_order: b.displayOrder,
    })),
  );
  const { error: bErr } = await db.from("question_blanks").insert(blankRows);
  if (bErr) {
    return NextResponse.json({ error: bErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    topics: MOCK_TOPICS.length,
    questions: questionRows.length,
    blanks: blankRows.length,
  });
}
