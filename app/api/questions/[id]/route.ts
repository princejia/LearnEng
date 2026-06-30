import { NextResponse } from "next/server";

// TODO: 接入 Supabase + 管理员鉴权后实现题目更新 / 删除
export async function PUT() {
  return NextResponse.json(
    { error: "题目更新暂未实现（待接入 Supabase）" },
    { status: 501 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "题目删除暂未实现（待接入 Supabase）" },
    { status: 501 },
  );
}
