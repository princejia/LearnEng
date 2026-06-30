"use client";

import { create } from "zustand";
import type {
  BlankStatus,
  MarkedStatus,
  Question,
  QuestionFilter,
} from "@/types";
import { answersEqual, lightHint } from "@/lib/utils";

interface QuestionState {
  values: string[]; // 每个填空框当前输入
  statuses: BlankStatus[]; // 每个填空框状态
  isCorrect: boolean | null; // null = 未提交
  hintUsed: boolean;
  marked: MarkedStatus;
}

interface PracticeState {
  sessionId: string | null;
  filter: QuestionFilter;
  questions: Question[];
  currentIndex: number;
  isPaused: boolean;
  states: Record<string, QuestionState>; // key: questionId

  // 初始化
  initSession: (
    sessionId: string,
    questions: Question[],
    filter: QuestionFilter,
  ) => void;

  // 输入与提交
  setInput: (blankIndex: number, value: string) => void;
  submit: () => { isCorrect: boolean } | null;

  // 提示
  applyHint: (blankIndex: number, full: boolean) => void;

  // 标记
  mark: (status: MarkedStatus) => void;

  // 导航
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;

  // 控制
  togglePause: () => void;
  resetProgress: () => void;

  // 派生值
  current: () => Question | null;
  currentState: () => QuestionState | null;
  answeredCount: () => number;
  correctCount: () => number;
}

function emptyState(blankCount: number): QuestionState {
  return {
    values: Array(blankCount).fill(""),
    statuses: Array(blankCount).fill("idle"),
    isCorrect: null,
    hintUsed: false,
    marked: "none",
  };
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  sessionId: null,
  filter: {},
  questions: [],
  currentIndex: 0,
  isPaused: false,
  states: {},

  initSession(sessionId, questions, filter) {
    const states: Record<string, QuestionState> = {};
    questions.forEach((q) => {
      states[q.id] = emptyState(q.blanks.length);
    });
    set({ sessionId, questions, filter, currentIndex: 0, isPaused: false, states });
  },

  setInput(blankIndex, value) {
    const q = get().current();
    if (!q || get().isPaused) return;
    set((s) => {
      const st = { ...s.states[q.id] };
      st.values = [...st.values];
      st.values[blankIndex] = value;
      // 修改即清除该框的对错状态
      st.statuses = [...st.statuses];
      if (st.statuses[blankIndex] !== "hinted") st.statuses[blankIndex] = "idle";
      return { states: { ...s.states, [q.id]: st } };
    });
  },

  submit() {
    const q = get().current();
    if (!q || get().isPaused) return null;
    const st = get().states[q.id];
    const statuses: BlankStatus[] = q.blanks.map((b, i) =>
      answersEqual(st.values[i] ?? "", b.answer) ? "correct" : "wrong",
    );
    const isCorrect = statuses.every((x) => x === "correct");
    set((s) => ({
      states: {
        ...s.states,
        [q.id]: { ...st, statuses, isCorrect },
      },
    }));
    return { isCorrect };
  },

  applyHint(blankIndex, full) {
    const q = get().current();
    if (!q) return;
    const blank = q.blanks[blankIndex];
    if (!blank) return;
    set((s) => {
      const st = { ...s.states[q.id] };
      st.values = [...st.values];
      st.statuses = [...st.statuses];
      if (full) {
        st.values[blankIndex] = blank.answer;
        st.statuses[blankIndex] = "hinted";
      } else {
        st.values[blankIndex] = "";
        st.statuses[blankIndex] = "hinted";
      }
      st.hintUsed = true;
      return { states: { ...s.states, [q.id]: st } };
    });
  },

  mark(status) {
    const q = get().current();
    if (!q) return;
    set((s) => ({
      states: { ...s.states, [q.id]: { ...s.states[q.id], marked: status } },
    }));
  },

  next() {
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
    }));
  },

  prev() {
    set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) }));
  },

  goTo(index) {
    set((s) => ({
      currentIndex: Math.max(0, Math.min(index, s.questions.length - 1)),
    }));
  },

  togglePause() {
    set((s) => ({ isPaused: !s.isPaused }));
  },

  resetProgress() {
    const { questions } = get();
    const states: Record<string, QuestionState> = {};
    questions.forEach((q) => {
      states[q.id] = emptyState(q.blanks.length);
    });
    set({ currentIndex: 0, states, isPaused: false });
  },

  current() {
    const { questions, currentIndex } = get();
    return questions[currentIndex] ?? null;
  },

  currentState() {
    const q = get().current();
    if (!q) return null;
    return get().states[q.id] ?? null;
  },

  answeredCount() {
    return Object.values(get().states).filter((s) => s.isCorrect !== null)
      .length;
  },

  correctCount() {
    return Object.values(get().states).filter((s) => s.isCorrect === true)
      .length;
  },
}));

export { lightHint };
