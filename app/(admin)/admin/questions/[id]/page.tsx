import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const repo = getRepository();
  const question = await repo.getQuestionById(params.id);
  if (!question) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">编辑题目</h1>
      <QuestionForm initial={question} />
    </div>
  );
}
