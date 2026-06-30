"use client";

import { BlankInput } from "./BlankInput";
import type { BlankStatus, SentenceToken } from "@/types";

interface BlankRowProps {
  tokens: SentenceToken[];
  answers: string[]; // 每个 blankIndex 的正确答案（用于宽度）
  values: string[];
  statuses: BlankStatus[];
  disabled?: boolean;
  onChange: (blankIndex: number, val: string) => void;
  onHoverWord: (word: string) => void;
}

export function BlankRow({
  tokens,
  answers,
  values,
  statuses,
  disabled,
  onChange,
  onHoverWord,
}: BlankRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
      {tokens.map((token, i) => {
        if (!token.isBlank) {
          // 固定展示的文字（含标点）
          const isPunct = /^[.,!?;:]+$/.test(token.text);
          return (
            <span
              key={`t-${i}`}
              className={isPunct ? "text-lg text-gray-700" : "text-lg text-gray-700"}
            >
              {token.text}
            </span>
          );
        }
        const bi = token.blankIndex as number;
        return (
          <BlankInput
            key={`b-${bi}`}
            index={bi}
            answerLength={answers[bi]?.length ?? 4}
            status={statuses[bi] ?? "idle"}
            value={values[bi] ?? ""}
            disabled={disabled}
            onChange={(v) => onChange(bi, v)}
            onHoverWord={() => onHoverWord(answers[bi] ?? "")}
          />
        );
      })}
    </div>
  );
}
