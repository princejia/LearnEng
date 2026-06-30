/**
 * TTS 生成工具。
 * 目前为占位实现：未配置 Azure/Google key 时抛出错误，
 * 前端会回退到 Web Speech API（见 hooks/useAudio.ts）。
 */

export interface TTSOptions {
  text: string;
  voice?: "en-US" | "en-GB";
}

export async function generateSpeech(opts: TTSOptions): Promise<ArrayBuffer> {
  const azureKey = process.env.AZURE_TTS_KEY;
  const azureRegion = process.env.AZURE_TTS_REGION;

  if (azureKey && azureRegion) {
    return generateWithAzure(opts, azureKey, azureRegion);
  }

  throw new Error("TTS 服务未配置（请设置 AZURE_TTS_KEY / AZURE_TTS_REGION）");
}

async function generateWithAzure(
  { text, voice = "en-US" }: TTSOptions,
  key: string,
  region: string,
): Promise<ArrayBuffer> {
  const voiceName =
    voice === "en-GB" ? "en-GB-SoniaNeural" : "en-US-JennyNeural";

  const ssml = `<speak version='1.0' xml:lang='${voice}'>
    <voice xml:lang='${voice}' name='${voiceName}'>${escapeXml(text)}</voice>
  </speak>`;

  const res = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    },
  );

  if (!res.ok) {
    throw new Error(`Azure TTS 失败: ${res.status} ${await res.text()}`);
  }
  return res.arrayBuffer();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
