"use client";

import { useEffect } from "react";

export interface KeyboardHandlers {
  onSubmit: () => void;
  onPlayAudio: () => void;
  onMarkMastered: () => void;
  onMarkWeak: () => void;
  onNext: () => void;
  onPrev: () => void;
  onFocusNextBlank: (backward: boolean) => void;
}

/** 全局键盘快捷键（见需求文档 §6） */
export function useKeyboard(handlers: KeyboardHandlers, isPaused: boolean) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isPaused) return;

      // 空格键 = 提交（英文单词无空格，可作全局提交键）
      if (e.code === "Space") {
        e.preventDefault();
        handlers.onSubmit();
        return;
      }
      if (e.ctrlKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        handlers.onPlayAudio();
        return;
      }
      if (e.ctrlKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        handlers.onMarkMastered();
        return;
      }
      if (e.ctrlKey && (e.key === "q" || e.key === "Q")) {
        e.preventDefault();
        handlers.onMarkWeak();
        return;
      }
      if (e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        handlers.onNext();
        return;
      }
      if (e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handlers.onPrev();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        handlers.onFocusNextBlank(e.shiftKey);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers, isPaused]);
}
