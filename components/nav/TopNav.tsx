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
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2 sm:px-4 sm:py-2.5">
        <Link
          href="/practice"
          className="mr-1 text-sm font-bold text-blue-600 sm:mr-2 sm:text-base"
        >
          英语拆句填空
        </Link>

        <button
          onClick={() => setFilterOpen(true)}
          className="rounded-lg px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 sm:px-3 sm:py-1.5 sm:text-sm"
        >
          学习内容
        </button>
        <button
          onClick={() => setModeOpen(true)}
          className="rounded-lg px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 sm:px-3 sm:py-1.5 sm:text-sm"
        >
          练习模式
        </button>
        <button
          onClick={togglePause}
          className="rounded-lg px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 sm:px-3 sm:py-1.5 sm:text-sm"
        >
          {isPaused ? "继续练习" : "暂停练习"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 sm:px-3 sm:py-1.5 sm:text-sm"
        >
          重置进度
        </button>

        <div className="order-last w-full sm:order-none sm:ml-auto sm:w-auto">
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
