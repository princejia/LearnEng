import { NextResponse } from "next/server";

const LIMIT = Number(process.env.ADMIN_HINT_DAILY_LIMIT ?? "10");

/**
 * 消耗一次提示。
 * mock 模式下直接返回成功（实际计数在前端 localStorage）。
 * 接入 Supabase 后改为基于 daily_hint_usage 表的原子自增 + 上限校验。
 */
export async function POST() {
  return NextResponse.json({ success: true, remaining: LIMIT });
}
