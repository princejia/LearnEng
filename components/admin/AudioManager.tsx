"use client";

import { Button } from "@/components/ui/button";

interface AudioManagerProps {
  english: string;
  audioUrl?: string | null;
}

/** 音频管理：生成 / 试听。生成调用 /api/audio/generate（未配置 TTS 时走 Web Speech 预览）。 */
export function AudioManager({ english, audioUrl }: AudioManagerProps) {
  function preview() {
    if (typeof window === "undefined") return;
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => speak());
    } else {
      speak();
    }
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(english);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  }

  async function generate() {
    const res = await fetch("/api/audio/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: "preview", text: english }),
    });
    if (!res.ok) {
      alert("TTS 服务未配置，已使用浏览器朗读预览。");
      speak();
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">
        {audioUrl ? "✅ 已有音频" : "尚无音频"}
      </span>
      <Button type="button" variant="secondary" size="sm" onClick={preview}>
        试听
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={generate}>
        生成音频
      </Button>
    </div>
  );
}
