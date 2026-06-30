"use client";

import { useMemo } from "react";
import { cn, splitWords } from "@/lib/utils";

interface BlankEditorProps {
  english: string;
  blankIndexes: number[]; // 选中作为填空的单词下标
  onChange: (indexes: number[]) => void;
}

/** 把英文句子按单词展示，点击切换某词是否为填空框 */
export function BlankEditor({ english, blankIndexes, onChange }: BlankEditorProps) {
  const words = useMemo(() => splitWords(english), [english]);
  const set = useMemo(() => new Set(blankIndexes), [blankIndexes]);

  function toggle(i: number) {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange(Array.from(next).sort((a, b) => a - b));
  }

  if (words.length === 0) {
    return <p className="text-sm text-gray-400">请先输入英文句子</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {words.map((w, i) => {
        const isBlank = set.has(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-sm transition-colors",
              isBlank
                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                : "border-gray-300 bg-white text-gray-700",
            )}
            title={isBlank ? "点击取消填空（变固定文字）" : "点击设为填空"}
          >
            {w}
          </button>
        );
      })}
    </div>
  );
}
