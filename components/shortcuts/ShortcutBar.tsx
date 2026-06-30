"use client";

const SHORTCUTS = [
  { keys: "空格", label: "提交" },
  { keys: "Tab", label: "跳格" },
  { keys: "Ctrl+M", label: "朗读" },
  { keys: "Ctrl+G", label: "标记掌握" },
  { keys: "Ctrl+Q", label: "标记不熟" },
  { keys: "Shift+→", label: "下一题" },
  { keys: "Shift+←", label: "上一题" },
];

export function ShortcutBar() {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2">
        {SHORTCUTS.map((s) => (
          <span key={s.keys} className="flex items-center gap-1 text-xs text-gray-500">
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
              {s.keys}
            </kbd>
            {s.label}
          </span>
        ))}
      </div>
    </footer>
  );
}
