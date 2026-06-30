import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: 接入 Supabase Auth 后在此校验 role = 'admin'，未授权重定向到登录页。
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link href="/admin/questions" className="font-bold text-blue-600">
            题库后台
          </Link>
          <nav className="flex gap-3 text-sm text-gray-600">
            <Link href="/admin/questions" className="hover:text-gray-900">
              题库列表
            </Link>
            <Link href="/admin/questions/new" className="hover:text-gray-900">
              新增题目
            </Link>
            <Link href="/admin/import" className="hover:text-gray-900">
              批量导入
            </Link>
          </nav>
          <Link
            href="/practice"
            className="ml-auto text-sm text-gray-400 hover:text-gray-600"
          >
            返回前台 →
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
