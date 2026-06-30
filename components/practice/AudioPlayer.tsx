"use client";

import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  onPlay: () => void;
  label?: string;
}

export function AudioPlayer({ onPlay, label = "朗读" }: AudioPlayerProps) {
  return (
    <Button variant="secondary" onClick={onPlay} title="Ctrl + M">
      🔊 {label}
    </Button>
  );
}
