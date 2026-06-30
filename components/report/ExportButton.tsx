"use client";

import { Button } from "@/components/ui/button";

export interface ExportRow {
  chinese: string;
  english: string;
  userAnswers: string[];
  answers: string[];
}

interface ExportButtonProps {
  summary: {
    total: number;
    correct: number;
    accuracy: number;
  };
  rows: ExportRow[];
}

/** 导出错题清单为 CSV 文件（UTF-8 BOM，Excel 可直接打开） */
export function ExportButton({ summary, rows }: ExportButtonProps) {
  function exportCsv() {
    const header = ["序号", "中文", "英文", "你的答案", "正确答案"];
    const lines = rows.map((r, i) =>
      [
        i + 1,
        r.chinese,
        r.english,
        r.userAnswers.join(" / "),
        r.answers.join(" / "),
      ]
        .map(csvCell)
        .join(","),
    );
    const meta = `# 总题量 ${summary.total} 答对 ${summary.correct} 正确率 ${summary.accuracy}%`;
    const content =
      "\uFEFF" + [meta, header.map(csvCell).join(","), ...lines].join("\r\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `错题清单_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
      导出
    </Button>
  );
}

function csvCell(v: string | number): string {
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
