"use client";

import { useState } from "react";
import { cn, answersEqual } from "@/lib/utils";

interface WrongQuestionItemProps {
  index: number;
  chinese: string;
  english: string;
  /** 每个填空框的正确答案 */
  answers: string[];
  /** 用户当时的作答 */
  userAnswers: string[];
}

export function WrongQuestionItem({
  index,
  chinese,
  english,
  answers,
  userAnswers,
}: WrongQuestionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="text-gray-400">{index}.</span> {chinese}
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
        >
          {open ? "收起" : "详情"}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-gray-200 pt-3">
          <p className="font-mono text-gray-700">{english}</p>
          <table className="w-full text-left">
            <thead className="text-xs text-gray-400">
              <tr>
                <th className="py-1">#</th>
                <th className="py-1">你的答案</th>
                <th className="py-1">正确答案</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((ans, i) => {
                const mine = userAnswers[i] ?? "";
                const ok = answersEqual(mine, ans);
                return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-1 text-gray-400">{i + 1}</td>
                    <td
                      className={cn(
                        "py-1 font-mono",
                        ok ? "text-green-600" : "text-red-500",
                      )}
                    >
                      {mine || "（空）"}
                    </td>
                    <td className="py-1 font-mono text-gray-700">{ans}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}
