import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";

const bodySchema = z.object({
  grade: z.number().optional(),
  unit: z.number().optional(),
  topic: z.string().optional(),
  mode: z.enum(["fill_blank", "dictation", "translate"]).optional(),
  questionIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const repo = getRepository();
  const result = await repo.createSession(parsed.data);
  return NextResponse.json(result);
}
