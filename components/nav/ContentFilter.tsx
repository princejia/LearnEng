"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Topic } from "@/types";

interface ContentFilterProps {
  open: boolean;
  onClose: () => void;
}

const GRADES = [
  { value: 6, label: "六年级" },
  { value: 7, label: "七年级" },
  { value: 8, label: "八年级" },
  { value: 9, label: "九年级" },
];

export function ContentFilter({ open, onClose }: ContentFilterProps) {
  const router = useRouter();
  const [grade, setGrade] = useState<number>(6);
  const [unit, setUnit] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((d) => setTopics(d.topics ?? []))
      .catch(() => setTopics([]));
  }, []);

  function start() {
    const params = new URLSearchParams();
    params.set("grade", String(grade));
    if (unit) params.set("unit", unit);
    if (selectedTopic) params.set("topic", selectedTopic);
    if (difficulty) params.set("difficulty", String(difficulty));
    params.set("shuffle", "true");
    router.push(`/practice?${params.toString()}`);
    onClose();
  }

  return (
    <>
      {/* 遮罩 */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      {/* 抽屉 */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[320px] max-w-[85vw] bg-white shadow-xl",
          "flex flex-col gap-6 p-6 transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <h2 className="text-lg font-semibold">学习内容</h2>

        <section>
          <p className="mb-2 text-sm font-medium text-gray-700">年级</p>
          <div className="flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g.value}
                onClick={() => setGrade(g.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  grade === g.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-gray-700">单元</p>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">全部单元</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((u) => (
              <option key={u} value={u}>
                Unit {u}
              </option>
            ))}
          </select>
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-gray-700">话题</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setSelectedTopic((cur) => (cur === t.name ? "" : t.name))
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  selectedTopic === t.name
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-gray-700">难度</p>
          <div className="flex gap-2">
            {[
              { value: 1, label: "基础" },
              { value: 2, label: "进阶" },
            ].map((d) => (
              <button
                key={d.value}
                onClick={() =>
                  setDifficulty((cur) => (cur === d.value ? null : d.value))
                }
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  difficulty === d.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <Button size="lg" className="mt-auto" onClick={start}>
          开始练习
        </Button>
      </aside>
    </>
  );
}
