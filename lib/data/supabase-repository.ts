import type {
  AnswerRecord,
  Difficulty,
  Grade,
  PracticeSession,
  Question,
  QuestionFilter,
  Topic,
} from "@/types";
import { shuffle, uuid } from "@/lib/utils";
import { buildQuestion, deriveBlankWordIndexes } from "./builder";
import type { CreateSessionInput, Repository } from "./repository";
import { createAdminClient } from "@/lib/supabase/admin";

/* ---------------------- 数据库行类型 ---------------------- */

interface QuestionRow {
  id: string;
  chinese: string;
  english: string;
  audio_url: string | null;
  grade: number;
  unit: number | null;
  topic: string | null;
  difficulty: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  question_blanks?: BlankRow[];
}

interface BlankRow {
  blank_index: number;
  answer: string;
  display_order: number;
}

interface SessionRow {
  id: string;
  user_id: string | null;
  filter_grade: number | null;
  filter_unit: number | null;
  filter_topic: string | null;
  mode: string;
  started_at: string;
  finished_at: string | null;
  total_count: number | null;
  correct_count: number | null;
}

interface AnswerRow {
  question_id: string;
  user_answer: string[] | null;
  is_correct: boolean | null;
  hint_used: boolean | null;
  marked_status: string | null;
  answered_at: string | null;
}

/* ---------------------- 行 → 领域对象映射 ---------------------- */

function rowToQuestion(row: QuestionRow): Question {
  const blanks = (row.question_blanks ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order);
  const blankWordIndexes = deriveBlankWordIndexes(
    row.english,
    blanks.map((b) => b.answer),
  );
  return buildQuestion({
    id: row.id,
    chinese: row.chinese,
    english: row.english,
    blankWordIndexes,
    grade: row.grade as Grade,
    unit: row.unit,
    topic: row.topic,
    difficulty: (row.difficulty as Difficulty) ?? 1,
    audioUrl: row.audio_url,
    isActive: row.is_active,
  });
}

function rowToSession(row: SessionRow): PracticeSession {
  return {
    id: row.id,
    userId: row.user_id,
    filterGrade: row.filter_grade,
    filterUnit: row.filter_unit,
    filterTopic: row.filter_topic,
    mode: (row.mode as PracticeSession["mode"]) ?? "fill_blank",
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    totalCount: row.total_count ?? 0,
    correctCount: row.correct_count ?? 0,
  };
}

function rowToAnswer(row: AnswerRow): AnswerRecord {
  return {
    questionId: row.question_id,
    userAnswers: row.user_answer ?? [],
    isCorrect: Boolean(row.is_correct),
    hintUsed: Boolean(row.hint_used),
    markedStatus: (row.marked_status as AnswerRecord["markedStatus"]) ?? "none",
    answeredAt: row.answered_at ?? undefined,
  };
}

/* ---------------------- Supabase 仓库实现 ---------------------- */

const QUESTION_SELECT =
  "id, chinese, english, audio_url, grade, unit, topic, difficulty, is_active, created_at, updated_at, question_blanks(blank_index, answer, display_order)";

export const supabaseRepository: Repository = {
  async listQuestions(filter: QuestionFilter) {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");

    let query = db
      .from("questions")
      .select(QUESTION_SELECT, { count: "exact" })
      .eq("is_active", true);

    if (filter.grade != null) query = query.eq("grade", filter.grade);
    if (filter.unit != null) query = query.eq("unit", filter.unit);
    if (filter.difficulty != null)
      query = query.eq("difficulty", filter.difficulty);
    if (filter.topic) query = query.ilike("topic", `%${filter.topic}%`);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    let questions = (data as QuestionRow[]).map(rowToQuestion);
    const total = count ?? questions.length;
    if (filter.shuffle) questions = shuffle(questions);
    if (filter.limit) questions = questions.slice(0, filter.limit);
    return { questions, total };
  },

  async getQuestionById(id: string) {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");
    const { data, error } = await db
      .from("questions")
      .select(QUESTION_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToQuestion(data as QuestionRow) : null;
  },

  async listTopics() {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");
    const { data, error } = await db.from("topics").select("id, name, label");
    if (error) throw new Error(error.message);
    return (data as Topic[]) ?? [];
  },

  async createSession(input: CreateSessionInput) {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");

    let totalCount = input.questionIds?.length ?? 0;
    if (!input.questionIds) {
      let countQuery = db
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (input.grade != null) countQuery = countQuery.eq("grade", input.grade);
      if (input.unit != null) countQuery = countQuery.eq("unit", input.unit);
      if (input.topic) countQuery = countQuery.ilike("topic", `%${input.topic}%`);
      const { count } = await countQuery;
      totalCount = count ?? 0;
    }

    const id = uuid();
    const { error } = await db.from("practice_sessions").insert({
      id,
      user_id: null,
      filter_grade: input.grade ?? null,
      filter_unit: input.unit ?? null,
      filter_topic: input.topic ?? null,
      mode: input.mode ?? "fill_blank",
      total_count: totalCount,
      correct_count: 0,
    });
    if (error) throw new Error(error.message);
    return { sessionId: id };
  },

  async getSession(id: string) {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");

    const { data: sessionRow, error: sErr } = await db
      .from("practice_sessions")
      .select(
        "id, user_id, filter_grade, filter_unit, filter_topic, mode, started_at, finished_at, total_count, correct_count",
      )
      .eq("id", id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!sessionRow) return null;

    const { data: answerRows, error: aErr } = await db
      .from("answer_records")
      .select(
        "question_id, user_answer, is_correct, hint_used, marked_status, answered_at",
      )
      .eq("session_id", id);
    if (aErr) throw new Error(aErr.message);

    return {
      session: rowToSession(sessionRow as SessionRow),
      answers: ((answerRows as AnswerRow[]) ?? []).map(rowToAnswer),
    };
  },

  async updateSession(id, patch) {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");
    const dbPatch: Record<string, unknown> = {};
    if (patch.finishedAt !== undefined) dbPatch.finished_at = patch.finishedAt;
    if (patch.correctCount !== undefined)
      dbPatch.correct_count = patch.correctCount;
    if (patch.totalCount !== undefined) dbPatch.total_count = patch.totalCount;
    const { error } = await db
      .from("practice_sessions")
      .update(dbPatch)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async saveAnswer(sessionId: string, record: AnswerRecord) {
    const db = createAdminClient();
    if (!db) throw new Error("Supabase 未配置");

    const { error } = await db.from("answer_records").upsert(
      {
        session_id: sessionId,
        question_id: record.questionId,
        user_answer: record.userAnswers,
        is_correct: record.isCorrect,
        hint_used: record.hintUsed,
        marked_status: record.markedStatus,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_id" },
    );
    if (error) return { success: false };

    // 重新统计正确数
    const { count } = await db
      .from("answer_records")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("is_correct", true);
    await db
      .from("practice_sessions")
      .update({ correct_count: count ?? 0 })
      .eq("id", sessionId);

    return { success: true };
  },
};
