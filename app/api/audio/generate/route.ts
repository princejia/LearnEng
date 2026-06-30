import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSpeech } from "@/lib/tts";

const bodySchema = z.object({
  questionId: z.string(),
  text: z.string(),
  voice: z.enum(["en-US", "en-GB"]).default("en-US"),
});

/**
 * 生成句子音频。
 * 当前：调用 TTS 返回 MP3。未配置 TTS key 时返回 501，前端回退到 Web Speech API。
 * 接入 Supabase 后：上传到 Storage 并写回 questions.audio_url。
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const audio = await generateSpeech({
      text: parsed.data.text,
      voice: parsed.data.voice,
    });
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "TTS 生成失败" },
      { status: 501 },
    );
  }
}
