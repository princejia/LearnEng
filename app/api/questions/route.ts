import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";
import type { QuestionFilter } from "@/types";

const querySchema = z.object({
  grade: z.coerce.number().optional(),
  unit: z.coerce.number().optional(),
  topic: z.string().optional(),
  difficulty: z.coerce.number().optional(),
  mode: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
  shuffle: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const filter = parsed.data as QuestionFilter;
  const repo = getRepository();
  const result = await repo.listQuestions(filter);
  return NextResponse.json(result);
}

export async function POST() {
  // TODO: 接入 Supabase + 管理员鉴权后实现题目创建
  return NextResponse.json(
    { error: "题目创建暂未实现（待接入 Supabase）" },
    { status: 501 },
  );
}
