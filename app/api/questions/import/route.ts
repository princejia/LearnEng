import { NextResponse } from "next/server";

// TODO: 接入 Supabase 后实现批量导入（解析行 → 拆分 question_blanks → 批量写入）
export async function POST() {
  return NextResponse.json(
    { error: "批量导入暂未实现（待接入 Supabase）" },
    { status: 501 },
  );
}
