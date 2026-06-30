import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const repo = getRepository();
  const data = await repo.getSession(params.id);
  if (!data) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

const patchSchema = z.object({
  finishedAt: z.string().optional(),
  correctCount: z.number().optional(),
  totalCount: z.number().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const repo = getRepository();
  await repo.updateSession(params.id, parsed.data);
  return NextResponse.json({ success: true });
}
