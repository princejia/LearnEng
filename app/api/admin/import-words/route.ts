import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildQuestion, type RawQuestion } from "@/lib/data/builder";
import type { Difficulty, Grade } from "@/types";

interface WordEntry {
  english: string;
  chinese: string;
  unit: number;
  grade: number;
  difficulty: number;
}

/** 由内容生成稳定 UUID（便于幂等重导，不产生重复行）。 */
function deterministicUuid(input: string): string {
  const h = crypto.createHash("sha1").update(input).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(
    17,
    20,
  )}-${h.slice(20, 32)}`;
}

/**
 * 导入 eng.pdf 解析出的生词表（scripts/eng-words.json）到 Supabase。
 * 中文释义作为题面，英文词/短语作为答案（全挖空）。
 * 幂等：按内容生成稳定 id，重复执行覆盖更新。
 */
export async function POST() {
  const db = createAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase 未配置（缺少 SUPABASE_SERVICE_ROLE_KEY）" },
      { status: 400 },
    );
  }

  const file = path.join(process.cwd(), "scripts", "eng-words.json");
  let entries: WordEntry[];
  try {
    entries = JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    return NextResponse.json(
      { error: "找不到 scripts/eng-words.json，请先运行 parse_wordlist.py" },
      { status: 400 },
    );
  }

  const questions = entries.map((e) => {
    const id = deterministicUuid(`${e.english}|${e.unit}`);
    const raw: RawQuestion = {
      id,
      chinese: e.chinese,
      english: e.english,
      grade: e.grade as Grade,
      unit: e.unit,
      topic: null,
      difficulty: (e.difficulty as Difficulty) ?? 1,
    };
    return buildQuestion(raw);
  });

  const questionRows = questions.map((q) => ({
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
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const ids = questions.map((q) => q.id);
  await db.from("question_blanks").delete().in("question_id", ids);
  const blankRows = questions.flatMap((q) =>
    q.blanks.map((b) => ({
      question_id: q.id,
      blank_index: b.blankIndex,
      answer: b.answer,
      display_order: b.displayOrder,
    })),
  );
  const { error: bErr } = await db.from("question_blanks").insert(blankRows);
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    questions: questionRows.length,
    blanks: blankRows.length,
  });
}
