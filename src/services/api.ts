import type {
  ChatEntry,
  ChatMode,
  Correction,
  Level,
  PronunciationResult,
  TutorReply,
} from "../types";
import { VOCAB_SETS } from "../data/content";
import { REQUEST_TIMEOUT_MS } from "./config";

export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

async function request(
  baseUrl: string,
  path: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "tiempo de espera agotado" : "sin conexión";
    throw new ApiUnavailableError(`No se pudo contactar el servidor (${reason}).`);
  } finally {
    clearTimeout(timer);
  }
}

function normalizeCorrection(raw: unknown): Correction | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.fix !== "string") return null;
  return {
    status: typeof value.status === "string" ? value.status : "Casi perfecto 🟡",
    fix: value.fix,
    explanation: typeof value.explanation === "string" ? value.explanation : "",
    example: typeof value.example === "string" ? value.example : "",
    word: typeof value.word === "string" ? value.word : undefined,
    definition: typeof value.definition === "string" ? value.definition : undefined,
  };
}

/* ═══════════════════════════════════════════
   Chat con el tutor
═══════════════════════════════════════════ */

export type TutorRequest = {
  baseUrl: string;
  message: string;
  level: Level;
  mode: ChatMode;
  history: ChatEntry[];
  name: string;
};

export async function sendTutorMessage(params: TutorRequest): Promise<TutorReply> {
  const { baseUrl, message, level, mode, history, name } = params;

  try {
    const response = await request(baseUrl, "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, level, mode, history: history.slice(-10), name }),
    });

    if (!response.ok) throw new ApiUnavailableError(`El servidor respondió ${response.status}.`);

    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.reply !== "string" || data.reply.trim().length === 0) {
      throw new ApiUnavailableError("Respuesta vacía del servidor.");
    }

    const vocabulary = Array.isArray(data.vocabulary)
      ? data.vocabulary
          .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
          .map((item) => ({
            word: String(item.word ?? ""),
            translation: String(item.translation ?? ""),
            example: String(item.example ?? ""),
          }))
          .filter((item) => item.word.length > 0)
      : [];

    return {
      reply: data.reply,
      correction: normalizeCorrection(data.correction),
      vocabulary,
      provider: "openai",
    };
  } catch (error) {
    console.warn("[LingoAI] Tutor en modo local:", error);
    return { ...localTutorReply(message, level, mode), provider: "demo" };
  }
}

/* ═══════════════════════════════════════════
   Voz → texto (Whisper en el backend)
═══════════════════════════════════════════ */

function audioForm(uri: string, extra: Record<string, string> = {}): FormData {
  const form = new FormData();
  const name = uri.split("/").pop() || "recording.m4a";
  form.append("audio", {
    uri,
    name,
    type: "audio/m4a",
  } as unknown as Blob);
  Object.entries(extra).forEach(([key, value]) => form.append(key, value));
  return form;
}

export async function transcribeAudio(baseUrl: string, uri: string): Promise<{ text: string }> {
  const response = await request(baseUrl, "/api/transcribe", {
    method: "POST",
    body: audioForm(uri),
  });
  if (!response.ok) {
    throw new ApiUnavailableError(`El servidor de voz respondió ${response.status}.`);
  }
  const data = (await response.json()) as { text?: string };
  return { text: (data.text ?? "").trim() };
}

export async function scorePronunciation(
  baseUrl: string,
  uri: string,
  target: string,
): Promise<PronunciationResult> {
  const response = await request(
    baseUrl,
    "/api/pronounce",
    { method: "POST", body: audioForm(uri, { target }) },
    30_000,
  );
  if (!response.ok) {
    throw new ApiUnavailableError(`El servidor de voz respondió ${response.status}.`);
  }
  const data = (await response.json()) as {
    score?: number;
    transcript?: string;
    feedback?: string;
    words?: { word: string; ok: boolean }[];
  };

  return {
    score: Math.max(0, Math.min(100, Math.round(Number(data.score ?? 0)))),
    transcript: data.transcript ?? "",
    feedback: data.feedback ?? "Sigue practicando la claridad de cada palabra.",
    words: Array.isArray(data.words) ? data.words : [],
    provider: "openai",
  };
}

export async function pingServer(baseUrl: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const response = await request(baseUrl, "/api/health", { method: "GET" }, 6000);
    if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
    const data = (await response.json()) as { ok?: boolean; ai?: string; model?: string };
    return {
      ok: data.ok !== false,
      detail: data.ai === "live" ? `IA conectada (${data.model})` : "Servidor activo · modo demo",
    };
  } catch {
    return { ok: false, detail: "Sin conexión con el backend" };
  }
}

/* ═══════════════════════════════════════════
   Tutor local (respaldo si el backend no está disponible)
═══════════════════════════════════════════ */

const ERROR_RULES: { pattern: RegExp; correction: Omit<Correction, "status">; status: string }[] = [
  {
    pattern: /\bgoed\b/i,
    status: "Casi perfecto 🟡",
    correction: {
      fix: "La forma correcta es: \"I went to the store yesterday.\"",
      explanation:
        "'Go' es un verbo irregular: go → went → gone. 'Goed' no existe en inglés.",
      example: "I went to the store yesterday.",
      word: "went",
      definition: "pasado simple del verbo 'go' (ir)",
    },
  },
  {
    pattern: /\b(didn't|did not) went\b/i,
    status: "Casi perfecto 🟡",
    correction: {
      fix: "Después de 'didn't' el verbo va en forma base: \"I didn't go.\"",
      explanation: "El auxiliar 'did' ya marca el pasado, el verbo principal no se conjuga.",
      example: "I didn't go to the party last night.",
      word: "didn't go",
      definition: "negación en pasado: no fui",
    },
  },
  {
    pattern: /\b(he|she|it) have\b/i,
    status: "Casi perfecto 🟡",
    correction: {
      fix: "Con he/she/it se usa 'has': \"She has a car.\"",
      explanation: "Tercera persona singular en presente: have → has.",
      example: "He has a car. She has two brothers.",
      word: "has",
      definition: "tener, conjugado para he/she/it",
    },
  },
  {
    pattern: /\b(he|she|it) don't\b/i,
    status: "Casi perfecto 🟡",
    correction: {
      fix: "Con he/she/it se usa 'doesn't': \"She doesn't like coffee.\"",
      explanation: "En negación de tercera persona singular: doesn't + verbo base.",
      example: "She doesn't like coffee.",
      word: "doesn't",
      definition: "negación de 'does' para he/she/it",
    },
  },
  {
    pattern: /\bmore better\b/i,
    status: "Casi perfecto 🟡",
    correction: {
      fix: "Usa solo 'better': \"This one is better.\"",
      explanation: "'Better' ya es el comparativo de 'good'; no se le añade 'more'.",
      example: "This book is better than the movie.",
      word: "better",
      definition: "mejor (comparativo irregular de good)",
    },
  },
  {
    pattern: /\bi am agree\b/i,
    status: "Casi perfecto 🟡",
    correction: {
      fix: "Se dice \"I agree\": \"agree\" ya es un verbo.",
      explanation: "En inglés no se usa 'be' con 'agree': I agree / I don't agree.",
      example: "I agree with you.",
      word: "agree",
      definition: "estar de acuerdo",
    },
  },
];

const PRAISE = [
  "¡Perfecto! Tu inglés está mejorando notablemente. 🎉",
  "¡Excelente frase! Suena muy natural. ¿Seguimos?",
  "Great! That's a very natural way to say it. Keep going!",
  "¡Muy bien! Ahora intenta decirlo de otra forma. 💡",
];

const GRAMMAR_PROMPTS: Record<Level, string> = {
  beginner: "¿Cómo se dice «Yo fui al mercado ayer» en inglés? Inténtalo ✍️",
  intermediate:
    "Complete the sentence: 'By the time she arrived, we ___ (already / finish) dinner.' Usa el tiempo verbal correcto.",
  advanced:
    "Rephrase this in a more formal register: 'I wanna talk about the thing that happened last week.'",
};

/** Respuesta de respaldo cuando no hay backend disponible (modo demo). */
export function localTutorReply(
  message: string,
  level: Level,
  mode: ChatMode,
): Omit<TutorReply, "provider"> {
  const rule = ERROR_RULES.find((item) => item.pattern.test(message));

  if (rule) {
    return {
      reply: "¡Casi! Cometiste un pequeño detalle gramatical 🔍. Mira la corrección:",
      correction: { status: rule.status, ...rule.correction },
      vocabulary: [],
    };
  }

  if (mode === "grammar") {
    return {
      reply: `¡Bien! Vamos con otra estructura.\n\n${GRAMMAR_PROMPTS[level]}`,
      correction: null,
      vocabulary: [],
    };
  }

  if (mode === "vocabulary") {
    const words = VOCAB_SETS[level];
    const pick = words[Math.floor(Math.random() * words.length)];
    return {
      reply: `Nueva palabra para tu nivel: **${pick.word}** — ${pick.translation}.\n\nEjemplo: "${pick.example}"`,
      correction: null,
      vocabulary: [pick],
    };
  }

  return {
    reply: `${PRAISE[Math.floor(Math.random() * PRAISE.length)]}\n\n(Estoy en modo local: conecta el backend para conversaciones ilimitadas con IA.)`,
    correction: null,
    vocabulary: [],
  };
}
