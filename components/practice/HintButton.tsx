"use client";

import { Button } from "@/components/ui/button";

interface HintButtonProps {
  onLightHint: () => void;
  onFullHint: () => void;
  remaining: number;
}

export function HintButton({ onLightHint, onFullHint, remaining }: HintButtonProps) {
  return (
    <>
      <Button variant="secondary" onClick={onLightHint}>
        💡 轻提示
      </Button>
      <Button
        variant="secondary"
        onClick={onFullHint}
        disabled={remaining <= 0}
        title={remaining <= 0 ? "今日提示次数已用完" : `今日剩余 ${remaining} 次`}
      >
        📖 全提示{remaining > 0 ? `（${remaining}）` : ""}
      </Button>
    </>
  );
}
