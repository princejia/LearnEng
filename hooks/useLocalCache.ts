"use client";

import { get, set, del } from "idb-keyval";
import { useCallback } from "react";
import type { LocalSession } from "@/types";

const key = (sessionId: string) => `session_${sessionId}`;

/** IndexedDB 本地缓存：答题进度离线优先保存 */
export function useLocalCache() {
  const saveSession = useCallback(async (s: LocalSession) => {
    await set(key(s.sessionId), { ...s, lastSaved: Date.now() });
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    return (await get<LocalSession>(key(sessionId))) ?? null;
  }, []);

  const clearSession = useCallback(async (sessionId: string) => {
    await del(key(sessionId));
  }, []);

  return { saveSession, loadSession, clearSession };
}
