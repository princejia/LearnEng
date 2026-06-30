import Link from "next/link";
import { getRepository } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { WrongQuestionItem } from "@/components/report/WrongQuestionItem";
import { ExportButton, type ExportRow } from "@/components/report/ExportButton";
import { formatDuration } from "@/lib/utils";

export default async function ReportPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const repo = getRepository();
  const data = await repo.getSession(params.sessionId);

  if (!data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-gray-500">
        <p>未找到该练习记录（可能服务已重启，mock 数据为内存存储）。</p>
        <Link href="/practice">
          <Button>返回练习</Button>
        </Link>
      </div>
    );
  }

  const { session, answers } = data;
  const total = session.totalCount;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const duration =
    session.finishedAt && session.startedAt
      ? new Date(session.finishedAt).getTime() -
        new Date(session.startedAt).getTime()
      : 0;

  const wrong = answers.filter((a) => !a.isCorrect);
  const wrongDetails = await Promise.all(
    wrong.map(async (a) => ({
      record: a,
      question: await repo.getQuestionById(a.questionId),
    })),
  );

  const exportRows: ExportRow[] = wrongDetails.map(({ record, question }) => ({
    chinese: question?.chinese ?? "（题目已删除）",
    english: question?.english ?? "",
    userAnswers: record.userAnswers,
    answers: question?.blanks.map((b) => b.answer) ?? [],
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <h1 className="text-2xl font-bold">🎉 练习完成！</h1>
        <div className="mt-4 flex justify-center gap-8 text-sm text-gray-600">
          <span>总题量：{total}</span>
          <span>答对：{correct}</span>
          <span>正确率：{accuracy}%</span>
          {duration > 0 && <span>用时：{formatDuration(duration)}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">错题清单（{wrongDetails.length} 题）</h2>
        {wrongDetails.length === 0 ? (
          <p className="text-sm text-green-600">太棒了，全部答对！</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {wrongDetails.map(({ record, question }, i) => (
              <WrongQuestionItem
                key={record.questionId}
                index={i + 1}
                chinese={question?.chinese ?? "（题目已删除）"}
                english={question?.english ?? ""}
                answers={question?.blanks.map((b) => b.answer) ?? []}
                userAnswers={record.userAnswers}
              />
            ))}
          </ol>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Link href="/practice">
          <Button>再练一遍</Button>
        </Link>
        <Link href="/practice">
          <Button variant="secondary">错题专项</Button>
        </Link>
        <ExportButton
          summary={{ total, correct, accuracy }}
          rows={exportRows}
        />
      </div>
    </div>
  );
}
