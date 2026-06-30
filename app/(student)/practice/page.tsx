"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePracticeStore } from "@/hooks/usePracticeStore";
import { useAudio } from "@/hooks/useAudio";
import { useHint } from "@/hooks/useHint";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useLocalCache } from "@/hooks/useLocalCache";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { BlankRow } from "@/components/practice/BlankRow";
import { AudioPlayer } from "@/components/practice/AudioPlayer";
import { HintButton } from "@/components/practice/HintButton";
import { AnswerFeedback } from "@/components/practice/AnswerFeedback";
import { Button } from "@/components/ui/button";
import { lightHint } from "@/lib/utils";
import type { Question, QuestionFilter } from "@/types";

function parseFilter(sp: URLSearchParams): QuestionFilter {
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  return {
    grade: num("grade") as QuestionFilter["grade"],
    unit: num("unit"),
    topic: sp.get("topic") ?? undefined,
    difficulty: num("difficulty") as QuestionFilter["difficulty"],
    shuffle: sp.get("shuffle") === "true",
    limit: num("limit") ?? 20,
  };
}

function PracticeClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { play, playWord } = useAudio();
  const { remaining, consumeFullHint } = useHint();
  const { saveSession } = useLocalCache();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionId = usePracticeStore((s) => s.sessionId);
  const questions = usePracticeStore((s) => s.questions);
  const currentIndex = usePracticeStore((s) => s.currentIndex);
  const isPaused = usePracticeStore((s) => s.isPaused);
  const initSession = usePracticeStore((s) => s.initSession);
  const setInput = usePracticeStore((s) => s.setInput);
  const submit = usePracticeStore((s) => s.submit);
  const applyHint = usePracticeStore((s) => s.applyHint);
  const mark = usePracticeStore((s) => s.mark);
  const next = usePracticeStore((s) => s.next);
  const prev = usePracticeStore((s) => s.prev);

  const current = usePracticeStore((s) => s.questions[s.currentIndex] ?? null);
  const currentState = usePracticeStore((s) =>
    current ? s.states[current.id] ?? null : null,
  );

  // 加载题目并创建会话
  useEffect(() => {
    let cancelled = false;
    const filter = parseFilter(sp);
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        Object.entries(filter).forEach(([k, v]) => {
          if (v != null && v !== "") qs.set(k, String(v));
        });
        const qRes = await fetch(`/api/questions?${qs.toString()}`);
        const qData = await qRes.json();
        const loaded: Question[] = qData.questions ?? [];
        if (loaded.length === 0) {
          if (!cancelled) setError("当前筛选条件下暂无题目，请调整「学习内容」。");
          return;
        }
        const sRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: filter.grade,
            unit: filter.unit,
            topic: filter.topic,
            mode: "fill_blank",
            questionIds: loaded.map((q) => q.id),
          }),
        });
        const sData = await sRes.json();
        if (cancelled) return;
        initSession(sData.sessionId, loaded, filter);
      } catch {
        if (!cancelled) setError("加载题目失败，请稍后重试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  // 切题：自动聚焦第一个空输入框 + 自动朗读
  useEffect(() => {
    if (!current || isPaused) return;
    const t = setTimeout(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>("input[data-blank-index]"),
      );
      const firstEmpty = inputs.find((el) => !el.value) ?? inputs[0];
      firstEmpty?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [current, currentIndex, isPaused]);

  const saveCurrentAnswer = useCallback(
    async (isCorrect: boolean) => {
      if (!current || !currentState || !sessionId) return;
      const payload = {
        sessionId,
        questionId: current.id,
        userAnswers: currentState.values,
        isCorrect,
        hintUsed: currentState.hintUsed,
        markedStatus: currentState.marked,
      };
      // 本地缓存（离线优先）
      saveSession({
        sessionId,
        filter: parseFilter(sp),
        questionIds: questions.map((q) => q.id),
        currentIndex,
        answers: { [current.id]: { ...payload, answeredAt: new Date().toISOString() } },
        lastSaved: Date.now(),
      }).catch(() => {});
      // 云端（mock 内存）
      fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    },
    [current, currentState, sessionId, questions, currentIndex, sp, saveSession],
  );

  const finishSession = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finishedAt: new Date().toISOString() }),
    }).catch(() => {});
    router.push(`/report/${sessionId}`);
  }, [sessionId, router]);

  const handleSubmit = useCallback(() => {
    const result = submit();
    if (!result) return;
    saveCurrentAnswer(result.isCorrect);
    if (result.isCorrect) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        if (currentIndex >= questions.length - 1) {
          finishSession();
        } else {
          next();
        }
      }, 800);
    }
  }, [submit, saveCurrentAnswer, currentIndex, questions.length, next, finishSession]);

  const handlePlayAudio = useCallback(() => {
    if (current) play(current.audioUrl, current.english);
  }, [current, play]);

  const handleFocusNextBlank = useCallback((backward: boolean) => {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[data-blank-index]"),
    );
    const idx = inputs.findIndex((el) => el === document.activeElement);
    const nextIdx = backward ? idx - 1 : idx + 1;
    inputs[(nextIdx + inputs.length) % inputs.length]?.focus();
  }, []);

  const handleLightHint = useCallback(() => {
    if (!current || !currentState) return;
    // 对当前聚焦的填空框给轻提示，否则第一个未填的
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[data-blank-index]"),
    );
    const activeIdx = inputs.findIndex((el) => el === document.activeElement);
    const targetIdx =
      activeIdx >= 0
        ? activeIdx
        : currentState.values.findIndex((v) => !v);
    const bi = targetIdx >= 0 ? targetIdx : 0;
    const answer = current.blanks[bi]?.answer ?? "";
    applyHint(bi, false);
    setInput(bi, lightHint(answer).replace(/_/g, ""));
  }, [current, currentState, applyHint, setInput]);

  const handleFullHint = useCallback(() => {
    if (!current) return;
    if (!consumeFullHint()) return; // 次数用完
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[data-blank-index]"),
    );
    const activeIdx = inputs.findIndex((el) => el === document.activeElement);
    const bi = activeIdx >= 0 ? activeIdx : 0;
    applyHint(bi, true);
  }, [current, applyHint, consumeFullHint]);

  useKeyboard(
    {
      onSubmit: handleSubmit,
      onPlayAudio: handlePlayAudio,
      onMarkMastered: () => mark("mastered"),
      onMarkWeak: () => mark("weak"),
      onNext: next,
      onPrev: prev,
      onFocusNextBlank: handleFocusNextBlank,
    },
    isPaused,
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-400">
        加载题目中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!current || !currentState) return null;

  return (
    <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      {isPaused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 text-lg text-gray-500 backdrop-blur-sm">
          已暂停，点击顶部「继续练习」恢复
        </div>
      )}

      <QuestionCard
        chinese={current.chinese}
        questionNo={currentIndex + 1}
        totalCount={questions.length}
      />

      <BlankRow
        tokens={current.tokens}
        answers={current.blanks.map((b) => b.answer)}
        values={currentState.values}
        statuses={currentState.statuses}
        disabled={isPaused}
        onChange={setInput}
        onHoverWord={(w) => playWord(w)}
      />

      <AnswerFeedback
        isCorrect={currentState.isCorrect}
        english={current.english}
        showAnswer
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <AudioPlayer onPlay={handlePlayAudio} />
        <HintButton
          onLightHint={handleLightHint}
          onFullHint={handleFullHint}
          remaining={remaining}
        />
        <Button onClick={handleSubmit}>提交（空格）</Button>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={prev} disabled={currentIndex === 0}>
          ← 上一题
        </Button>
        <span className="text-xs text-gray-400">
          {currentState.marked === "mastered" && "已标记：掌握"}
          {currentState.marked === "weak" && "已标记：不熟悉"}
        </span>
        <Button
          variant="ghost"
          onClick={next}
          disabled={currentIndex >= questions.length - 1}
        >
          下一题 →
        </Button>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center text-gray-400">
          加载中…
        </div>
      }
    >
      <PracticeClient />
    </Suspense>
  );
}
