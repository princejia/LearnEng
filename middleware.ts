import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 刷新 Supabase session（mock 模式下直接放行）
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 匹配除静态资源外的所有路径：
     * - _next/static、_next/image、favicon、常见图片/字体
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|woff2?)$).*)",
  ],
};
