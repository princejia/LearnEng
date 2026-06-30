import Link from "next/link";
import { getRepository } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";

export default async function AdminQuestionsPage() {
  const repo = getRepository();
  const { questions, total } = await repo.listQuestions({ limit: 200 });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">题库列表（共 {total} 题）</h1>
        <Link href="/admin/questions/new">
          <Button>新增题目</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2">中文</th>
              <th className="px-3 py-2">英文</th>
              <th className="px-3 py-2">年级</th>
              <th className="px-3 py-2">单元</th>
              <th className="px-3 py-2">话题</th>
              <th className="px-3 py-2">音频</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2">{q.chinese}</td>
                <td className="px-3 py-2 text-gray-500">{q.english}</td>
                <td className="px-3 py-2">{q.grade}</td>
                <td className="px-3 py-2">{q.unit ?? "-"}</td>
                <td className="px-3 py-2">{q.topic ?? "-"}</td>
                <td className="px-3 py-2">{q.audioUrl ? "✅" : "—"}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/questions/${q.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
