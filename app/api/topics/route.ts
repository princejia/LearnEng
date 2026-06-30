import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";

export async function GET() {
  const repo = getRepository();
  const topics = await repo.listTopics();
  return NextResponse.json({ topics });
}
