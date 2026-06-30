"use client";

import { useState } from "react";
import Link from "next/link";
import { usePracticeStore } from "@/hooks/usePracticeStore";
import { ContentFilter } from "./ContentFilter";
import { ModeSelector } from "./ModeSelector";
import { ProgressBar } from "./ProgressBar";

export function TopNav() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  const isPaused = usePracticeStore((s) => s.isPaused);
  const togglePause = usePracticeStore((s) => s.togglePause);
  const resetProgress = usePracticeStore((s) => s.resetProgress);
  const questions = usePracticeStore((s) => s.questions);
  const answeredCount = usePracticeStore((s) => s.answeredCount());
  const correctCount = usePracticeStore((s) => s.correctCount());

  function handleReset() {
    if (window.confirm("确定要重置当前练习进度吗？已填写的答案将清空。")) {
      resetProgress();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2.5">
        <Link href="/practice" className="mr-2 text-base font-bold text-blue-600">
          英语拆句填空
        </Link>

        <button
          onClick={() => setFilterOpen(true)}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          学习内容
        </button>
        <button
          onClick={() => setModeOpen(true)}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          练习模式
        </button>
        <button
          onClick={togglePause}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          {isPaused ? "继续练习" : "暂停练习"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          重置进度
        </button>

        <div className="ml-auto">
          <ProgressBar
            completedCount={answeredCount}
            totalCount={questions.length}
            correctCount={correctCount}
            answeredCount={answeredCount}
          />
        </div>
      </nav>

      <ContentFilter open={filterOpen} onClose={() => setFilterOpen(false)} />
      <ModeSelector open={modeOpen} onClose={() => setModeOpen(false)} />
    </header>
  );
}
