import { NextResponse } from "next/server";

const LIMIT = Number(process.env.ADMIN_HINT_DAILY_LIMIT ?? "10");

/**
 * 剩余提示次数。
 * mock 模式下不做服务端计数（前端 useHint 用 localStorage 管理），
 * 这里仅返回每日上限，接入 Supabase 后再按用户统计。
 */
export async function GET() {
  return NextResponse.json({ remaining: LIMIT, limit: LIMIT });
}
