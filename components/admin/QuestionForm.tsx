"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BlankEditor } from "./BlankEditor";
import { AudioManager } from "./AudioManager";
import { splitWords } from "@/lib/utils";
import type { Question } from "@/types";

interface QuestionFormProps {
  initial?: Question;
}

export function QuestionForm({ initial }: QuestionFormProps) {
  const router = useRouter();
  const [chinese, setChinese] = useState(initial?.chinese ?? "");
  const [english, setEnglish] = useState(initial?.english ?? "");
  const [grade, setGrade] = useState<number>(initial?.grade ?? 6);
  const [unit, setUnit] = useState<string>(
    initial?.unit != null ? String(initial.unit) : "",
  );
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [difficulty, setDifficulty] = useState<number>(initial?.difficulty ?? 1);
  const [blankIndexes, setBlankIndexes] = useState<number[]>(
    initial?.tokens
      .filter((t) => t.isBlank)
      .map((t) => t.blankIndex as number) ?? [],
  );
  const [saving, setSaving] = useState(false);

  function autoSplit() {
    setBlankIndexes(splitWords(english).map((_, i) => i));
  }

  async function save() {
    setSaving(true);
    const payload = {
      id: initial?.id,
      chinese,
      english,
      grade,
      unit: unit ? Number(unit) : null,
      topic: topic || null,
      difficulty,
      blankWordIndexes: blankIndexes,
    };
    const res = await fetch(
      initial ? `/api/questions/${initial.id}` : "/api/questions",
      {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (res.ok) {
      router.push("/admin/questions");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(
        `保存失败（${res.status}）：${data.error ?? "题库写入待接入 Supabase"}`,
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">中文句子</span>
        <input
          value={chinese}
          onChange={(e) => setChinese(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">英文句子</span>
        <input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 font-mono"
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">填空框拆分</span>
          <Button type="button" variant="secondary" size="sm" onClick={autoSplit}>
            自动拆分（全部挖空）
          </Button>
        </div>
        <BlankEditor
          english={english}
          blankIndexes={blankIndexes}
          onChange={setBlankIndexes}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">年级</span>
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {[6, 7, 8, 9].map((g) => (
              <option key={g} value={g}>
                {g} 年级
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">单元</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="如 3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">话题</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="如 school,daily"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">难度</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value={1}>基础</option>
            <option value={2}>进阶</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">音频</span>
        <AudioManager english={english} audioUrl={initial?.audioUrl} />
      </div>

      <div className="flex gap-3">
        <Button onClick={save} disabled={saving || !chinese || !english}>
          {saving ? "保存中…" : "保存"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </div>
  );
}
