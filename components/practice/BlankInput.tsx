"use client";

import { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import type { BlankStatus } from "@/types";

interface BlankInputProps {
  index: number;
  answerLength: number; // 用于自适应宽度
  status: BlankStatus;
  value: string;
  disabled?: boolean;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onHoverWord?: () => void; // 触发单词朗读
}

const statusStyle: Record<BlankStatus, string> = {
  idle: "border-gray-300 bg-white text-gray-900",
  correct: "border-green-500 bg-green-50 text-green-700",
  wrong: "border-red-400 bg-red-50 text-red-600",
  hinted: "border-yellow-400 bg-yellow-50 text-gray-900",
};

export const BlankInput = forwardRef<HTMLInputElement, BlankInputProps>(
  function BlankInput(
    { index, answerLength, status, value, disabled, onChange, onFocus, onHoverWord },
    ref,
  ) {
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleEnter() {
      if (!onHoverWord) return;
      hoverTimer.current = setTimeout(() => onHoverWord(), 500);
    }
    function handleLeave() {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        data-blank-index={index}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ width: `${Math.max(3, answerLength * 0.85 + 1.2)}rem` }}
        className={cn(
          "h-10 rounded-md border-2 px-2 text-center font-mono text-base outline-none transition-colors",
          "min-w-[3rem] focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
          "disabled:opacity-60",
          statusStyle[status],
        )}
      />
    );
  },
);
