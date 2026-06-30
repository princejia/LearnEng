// 全局 TypeScript 类型定义

export type Grade = 6 | 7 | 8 | 9;
export type Difficulty = 1 | 2; // 1=基础 2=进阶
export type PracticeMode = "fill_blank" | "dictation" | "translate";
export type MarkedStatus = "none" | "mastered" | "weak";
export type BlankStatus = "idle" | "correct" | "wrong" | "hinted";

/** 填空框配置 */
export interface QuestionBlank {
  id: string;
  questionId: string;
  blankIndex: number; // 填空框顺序（从 0 开始）
  answer: string; // 标准答案（单词）
  displayOrder: number; // 展示顺序
}

/**
 * 句子由若干 token 组成，token 可能是固定展示的文字，也可能是一个填空框。
 * 用于在答题页把英文句子拆分渲染。
 */
export interface SentenceToken {
  text: string; // 该 token 的英文文本（固定文字或填空答案）
  isBlank: boolean; // 是否为填空框
  blankIndex?: number; // 若是填空框，对应的 blankIndex
}

/** 题目 */
export interface Question {
  id: string;
  chinese: string; // 中文句子
  english: string; // 完整英文句子
  audioUrl?: string | null; // 音频地址
  grade: Grade;
  unit?: number | null;
  topic?: string | null;
  difficulty: Difficulty;
  isActive: boolean;
  blanks: QuestionBlank[];
  /** 拆分后的句子 token（由 english + blanks 推导，便于渲染） */
  tokens: SentenceToken[];
  createdAt?: string;
  updatedAt?: string;
}

/** 话题标签 */
export interface Topic {
  id: string;
  name: string; // 英文 key
  label: string; // 中文显示名
}

/** 题库筛选条件 */
export interface QuestionFilter {
  grade?: Grade;
  unit?: number;
  topic?: string;
  difficulty?: Difficulty;
  mode?: PracticeMode;
  limit?: number;
  shuffle?: boolean;
}

/** 练习会话 */
export interface PracticeSession {
  id: string;
  userId?: string | null;
  filterGrade?: number | null;
  filterUnit?: number | null;
  filterTopic?: string | null;
  mode: PracticeMode;
  startedAt: string;
  finishedAt?: string | null;
  totalCount: number;
  correctCount: number;
}

/** 单题作答记录 */
export interface AnswerRecord {
  questionId: string;
  userAnswers: string[]; // 每个填空框的作答
  isCorrect: boolean;
  hintUsed: boolean;
  markedStatus: MarkedStatus;
  answeredAt?: string;
}

/** 本地缓存的会话结构（IndexedDB） */
export interface LocalSession {
  sessionId: string;
  filter: QuestionFilter;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>; // key: questionId
  lastSaved: number; // timestamp
}
