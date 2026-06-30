"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ParsedRow {
  chinese: string;
  english: string;
  grade: string;
  unit: string;
  topic: string;
}

/** 极简 CSV 解析（支持双引号包裹与逗号转义） */
function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return {
      chinese: cols[idx("chinese")] ?? "",
      english: cols[idx("english")] ?? "",
      grade: cols[idx("grade")] ?? "",
      unit: cols[idx("unit")] ?? "",
      topic: cols[idx("topic")] ?? "",
    };
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((c) => c.trim());
}

export function BulkImport() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRows(parseCSV(String(reader.result ?? "")));
    reader.readAsText(file, "utf-8");
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function confirmImport() {
    setImporting(true);
    const res = await fetch("/api/questions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    }).catch(() => null);
    setImporting(false);
    if (res?.ok) {
      alert(`导入成功 ${rows.length} 题`);
      setRows([]);
    } else {
      alert("批量导入待接入 Supabase（当前为 mock 模式，解析预览已完成）。");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
        <p className="mb-3 text-sm text-gray-500">
          CSV 表头：chinese,english,grade,unit,topic
        </p>
        <input type="file" accept=".csv" onChange={handleFile} />
      </div>

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2">中文</th>
                  <th className="px-3 py-2">英文</th>
                  <th className="px-3 py-2">年级</th>
                  <th className="px-3 py-2">单元</th>
                  <th className="px-3 py-2">话题</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2">{r.chinese}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{r.english}</td>
                    <td className="px-3 py-2">{r.grade}</td>
                    <td className="px-3 py-2">{r.unit}</td>
                    <td className="px-3 py-2">{r.topic}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeRow(i)}
                        className="text-red-500 hover:underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={confirmImport} disabled={importing}>
            {importing ? "导入中…" : `确认导入 ${rows.length} 题`}
          </Button>
        </>
      )}
    </div>
  );
}
