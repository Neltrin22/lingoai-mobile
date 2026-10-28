export type Level = "beginner" | "intermediate" | "advanced";

export type ChatMode = "free" | "vocabulary" | "grammar" | "pronunciation" | "exercise";

export type Tab = "dashboard" | "chat" | "progress" | "profile";

export type WidgetKind = "exercise" | "vocabulary" | "pronunciation";

export type Correction = {
  status: string;
  fix: string;
  explanation: string;
  example: string;
  /** Palabra o expresión que generó el error (alimenta las flashcards). */
  word?: string;
  /** Significado breve de `word` para la flashcard. */
  definition?: string;
};

export type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  correction?: Correction | null;
  widget?: WidgetKind | null;
  provider?: "openai" | "demo";
};

export type Flashcard = {
  id: string;
  word: string;
  definition: string;
  example: string;
  fromError: boolean;
  createdAt: number;
};

export type SkillKey = "vocabulary" | "grammar" | "pronunciation" | "comprehension";

export type Skills = Record<SkillKey, number>;

export type DayLog = {
  /** ISO date: YYYY-MM-DD */
  date: string;
  minutes: number;
  words: number;
  messages: number;
};

export type Progress = {
  skills: Skills;
  logs: DayLog[];
  streak: number;
  lastStudyDate: string | null;
  totalWords: number;
  totalMessages: number;
  corrections: number;
  exercisesDone: number;
  pronunciationTries: number;
  bestPronunciation: number;
};

export type TutorReply = {
  reply: string;
  correction: Correction | null;
  vocabulary: { word: string; translation: string; example: string }[];
  provider: "openai" | "demo";
};

export type PronunciationResult = {
  score: number;
  transcript: string;
  feedback: string;
  words: { word: string; ok: boolean }[];
  provider: "openai" | "demo";
};

export type ChatEntry = {
  role: "user" | "assistant";
  content: string;
};
