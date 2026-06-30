"use client";

import { useCallback, useRef } from "react";
import { Howl } from "howler";

/**
 * 音频播放：优先使用 Supabase Storage 预生成 MP3，
 * 失败时回退到浏览器 Web Speech API（speechSynthesis）。
 */
export function useAudio() {
  const soundRef = useRef<Howl | null>(null);

  const speak = useCallback((text: string, lang = "en-US") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  }, []);

  /** 播放整句：有 url 走 Howler，无 url 或失败走 TTS 降级 */
  const play = useCallback(
    (url: string | null | undefined, fallbackText?: string) => {
      if (!url) {
        if (fallbackText) speak(fallbackText);
        return;
      }
      soundRef.current?.unload();
      const sound = new Howl({
        src: [url],
        html5: true,
        onloaderror: () => fallbackText && speak(fallbackText),
        onplayerror: () => fallbackText && speak(fallbackText),
      });
      soundRef.current = sound;
      sound.play();
    },
    [speak],
  );

  /** 朗读单个单词（hover/长按触发），直接用 TTS 降级即可 */
  const playWord = useCallback(
    (word: string) => speak(word),
    [speak],
  );

  const stop = useCallback(() => {
    soundRef.current?.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { play, playWord, stop };
}
