import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";

const bodySchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  userAnswers: z.array(z.string()),
  isCorrect: z.boolean(),
  hintUsed: z.boolean().default(false),
  markedStatus: z.enum(["none", "mastered", "weak"]).default("none"),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, ...record } = parsed.data;
  const repo = getRepository();
  const result = await repo.saveAnswer(sessionId, record);
  return NextResponse.json(result);
}
