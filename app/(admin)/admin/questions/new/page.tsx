import { QuestionForm } from "@/components/admin/QuestionForm";

export default function NewQuestionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">新增题目</h1>
      <QuestionForm />
    </div>
  );
}
