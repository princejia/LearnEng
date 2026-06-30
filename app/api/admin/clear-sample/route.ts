import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 删除示例题（topic 非空的内置 mock 数据），只保留 eng.pdf 导入的词库题（topic 为空）。
 * 会先删除这些题关联的答题记录，避免外键约束报错。
 */
export async function POST() {
  const db = createAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase 未配置（缺少 SUPABASE_SERVICE_ROLE_KEY）" },
      { status: 400 },
    );
  }

  const { data: rows, error: selErr } = await db
    .from("questions")
    .select("id")
    .not("topic", "is", null);
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

  const ids = (rows ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  // 先删关联答题记录（无级联），question_blanks 有级联会自动删除
  await db.from("answer_records").delete().in("question_id", ids);

  const { error: delErr } = await db.from("questions").delete().in("id", ids);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: ids.length });
}
