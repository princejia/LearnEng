"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
  correctCount: number;
  answeredCount: number;
}

export function ProgressBar({
  completedCount,
  totalCount,
  correctCount,
  answeredCount,
}: ProgressBarProps) {
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const accuracy = correctCount / Math.max(answeredCount, 1);

  const barColor =
    accuracy < 0.6
      ? "bg-red-400"
      : accuracy < 0.8
        ? "bg-yellow-400"
        : "bg-green-400";

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColor)}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap tabular-nums">
        {completedCount}/{totalCount}
        {answeredCount > 0 && (
          <span className="ml-2 text-gray-400">
            正确率 {Math.round(accuracy * 100)}%
          </span>
        )}
      </span>
    </div>
  );
}
