import { TopNav } from "@/components/nav/TopNav";
import { ShortcutBar } from "@/components/shortcuts/ShortcutBar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1">{children}</main>
      <ShortcutBar />
    </div>
  );
}
