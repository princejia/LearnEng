import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 服务端 admin client（使用 Service Role Key，绕过 RLS）。
 * 仅可在服务端（Route Handler / Server Component / 脚本）使用，切勿暴露到浏览器。
 * 未配置环境变量时返回 null。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
