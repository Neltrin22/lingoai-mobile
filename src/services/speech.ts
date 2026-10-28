import * as Speech from "expo-speech";

/** Quita emojis y marcas de markdown para que el TTS suene natural. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/\*\*/g, "")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function speakEnglish(text: string, options: { rate?: number } = {}): void {
  const clean = stripForSpeech(text);
  if (!clean) return;
  Speech.stop();
  Speech.speak(clean, {
    language: "en-US",
    rate: options.rate ?? 0.92,
    pitch: 1,
  });
}

export async function stopSpeaking(): Promise<void> {
  await Speech.stop();
}
