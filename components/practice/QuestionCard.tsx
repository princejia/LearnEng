interface QuestionCardProps {
  chinese: string;
  questionNo: number; // 第几题（从 1 开始）
  totalCount: number;
}

export function QuestionCard({ chinese, questionNo, totalCount }: QuestionCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="text-sm text-gray-400">
        第 {questionNo} 题 / 共 {totalCount} 题
      </span>
      <p className="px-2 text-[1.25rem] font-medium leading-relaxed text-gray-800 md:text-[1.75rem]">
        {chinese}
      </p>
    </div>
  );
}
