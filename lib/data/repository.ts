import type {
  AnswerRecord,
  PracticeSession,
  PracticeMode,
  Question,
  QuestionFilter,
  Topic,
} from "@/types";
import { shuffle, uuid } from "@/lib/utils";
import { MOCK_QUESTIONS, MOCK_TOPICS } from "./mock-questions";
import { supabaseRepository } from "./supabase-repository";

export interface CreateSessionInput {
  grade?: number;
  unit?: number;
  topic?: string;
  mode?: PracticeMode;
  questionIds?: string[];
}

export interface Repository {
  listQuestions(
    filter: QuestionFilter,
  ): Promise<{ questions: Question[]; total: number }>;
  getQuestionById(id: string): Promise<Question | null>;
  listTopics(): Promise<Topic[]>;

  createSession(input: CreateSessionInput): Promise<{ sessionId: string }>;
  getSession(
    id: string,
  ): Promise<{ session: PracticeSession; answers: AnswerRecord[] } | null>;
  updateSession(
    id: string,
    patch: Partial<Pick<PracticeSession, "finishedAt" | "correctCount" | "totalCount">>,
  ): Promise<void>;

  saveAnswer(
    sessionId: string,
    record: AnswerRecord,
  ): Promise<{ success: boolean }>;
}

/* ---------------------- Mock 实现（内存存储，开发用） ---------------------- */

const sessionStore = new Map<
  string,
  { session: PracticeSession; answers: Map<string, AnswerRecord> }
>();

function applyFilter(filter: QuestionFilter): Question[] {
  let list = MOCK_QUESTIONS.filter((q) => q.isActive);
  if (filter.grade != null) list = list.filter((q) => q.grade === filter.grade);
  if (filter.unit != null) list = list.filter((q) => q.unit === filter.unit);
  if (filter.topic)
    list = list.filter((q) =>
      (q.topic ?? "")
        .split(",")
        .map((t) => t.trim())
        .includes(filter.topic as string),
    );
  if (filter.difficulty != null)
    list = list.filter((q) => q.difficulty === filter.difficulty);
  return list;
}

const mockRepository: Repository = {
  async listQuestions(filter) {
    let list = applyFilter(filter);
    const total = list.length;
    if (filter.shuffle) list = shuffle(list);
    if (filter.limit) list = list.slice(0, filter.limit);
    return { questions: list, total };
  },

  async getQuestionById(id) {
    return MOCK_QUESTIONS.find((q) => q.id === id) ?? null;
  },

  async listTopics() {
    return MOCK_TOPICS;
  },

  async createSession(input) {
    const id = uuid();
    const ids =
      input.questionIds ??
      applyFilter({
        grade: input.grade as never,
        unit: input.unit,
        topic: input.topic,
      }).map((q) => q.id);
    const session: PracticeSession = {
      id,
      userId: null,
      filterGrade: input.grade ?? null,
      filterUnit: input.unit ?? null,
      filterTopic: input.topic ?? null,
      mode: input.mode ?? "fill_blank",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      totalCount: ids.length,
      correctCount: 0,
    };
    sessionStore.set(id, { session, answers: new Map() });
    return { sessionId: id };
  },

  async getSession(id) {
    const entry = sessionStore.get(id);
    if (!entry) return null;
    return {
      session: entry.session,
      answers: Array.from(entry.answers.values()),
    };
  },

  async updateSession(id, patch) {
    const entry = sessionStore.get(id);
    if (!entry) return;
    Object.assign(entry.session, patch);
  },

  async saveAnswer(sessionId, record) {
    const entry = sessionStore.get(sessionId);
    if (!entry) return { success: false };
    entry.answers.set(record.questionId, record);
    entry.session.correctCount = Array.from(entry.answers.values()).filter(
      (a) => a.isCorrect,
    ).length;
    return { success: true };
  },
};

/* ---------------------- 工厂：按环境选择数据源 ---------------------- */

export function getRepository(): Repository {
  const source = process.env.DATA_SOURCE ?? "mock";
  if (
    source === "supabase" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return supabaseRepository;
  }
  return mockRepository;
}
