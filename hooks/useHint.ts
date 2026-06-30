"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 提示次数管理。
 * 未登录走本地（localStorage 按天计数）；登录用户走 /api/hints。
 */
export function useHint() {
  const limit = 10;
  const [remaining, setRemaining] = useState(limit);

  const todayKey = useCallback(() => {
    const d = new Date().toISOString().slice(0, 10);
    return `hint_usage_${d}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const used = Number(window.localStorage.getItem(todayKey()) ?? "0");
    setRemaining(Math.max(0, limit - used));
  }, [todayKey]);

  /** 消耗一次全提示，返回是否成功 */
  const consumeFullHint = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    const used = Number(window.localStorage.getItem(todayKey()) ?? "0");
    if (used >= limit) return false;
    window.localStorage.setItem(todayKey(), String(used + 1));
    setRemaining(Math.max(0, limit - used - 1));
    return true;
  }, [todayKey]);

  return { remaining, limit, consumeFullHint };
}
