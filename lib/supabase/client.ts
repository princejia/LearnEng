import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase client。
 * 未配置环境变量时返回 null，调用方应回退到本地 mock / IndexedDB。
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
