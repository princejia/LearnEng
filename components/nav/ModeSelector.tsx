"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModeSelectorProps {
  open: boolean;
  onClose: () => void;
}

const MODES = [
  { key: "fill_blank", label: "拆句填空", enabled: true, desc: "把英文句子拆成填空框逐词作答" },
  { key: "dictation", label: "听写模式", enabled: false, desc: "播放音频，听写完整句子" },
  { key: "translate", label: "英译中", enabled: false, desc: "展示英文，填写中文" },
];

export function ModeSelector({ open, onClose }: ModeSelectorProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">练习模式</h2>
        <div className="flex flex-col gap-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              disabled={!m.enabled}
              onClick={onClose}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                m.enabled
                  ? "border-blue-500 bg-blue-50"
                  : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.label}</span>
                {!m.enabled && (
                  <span className="text-xs text-gray-400">即将上线</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">{m.desc}</p>
            </button>
          ))}
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={onClose}>
          关闭
        </Button>
      </div>
    </div>
  );
}
