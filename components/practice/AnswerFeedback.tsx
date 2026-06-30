"use client";

import { cn } from "@/lib/utils";

interface AnswerFeedbackProps {
  isCorrect: boolean | null; // null = 未提交
  english: string; // 完整英文句子（答错时可对照）
  showAnswer?: boolean;
}

export function AnswerFeedback({ isCorrect, english, showAnswer }: AnswerFeedbackProps) {
  if (isCorrect === null) return <div className="h-6" />;
  return (
    <div
      className={cn(
        "flex animate-fade-in flex-col items-center gap-1 text-sm",
        isCorrect ? "text-green-600" : "text-red-500",
      )}
    >
      <span>{isCorrect ? "✅ 全部正确！" : "❌ 有错误，请修改后重新提交"}</span>
      {!isCorrect && showAnswer && (
        <span className="text-gray-500">参考：{english}</span>
      )}
    </div>
  );
}
