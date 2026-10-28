import type { ChatMode, Level, Skills } from "../types";

export type LevelConfig = {
  label: string;
  emoji: string;
  cefr: string;
  color: string;
  bg: string;
  topic: string;
  topicEs: string;
  welcomeMsg: string;
  suggestionPrompt: string;
  baseSkills: Skills;
};

export const LEVELS: Record<Level, LevelConfig> = {
  beginner: {
    label: "Principiante",
    emoji: "🌱",
    cefr: "A1–A2",
    color: "#10C98F",
    bg: "#DCFBF0",
    topic: "Greetings & introductions",
    topicEs: "Saludos y presentaciones",
    welcomeMsg:
      "Hola, soy LingoAI, tu tutor personal. Veo que estás empezando — no te preocupes, iremos paso a paso. ¿Quieres que empecemos presentándonos en inglés?",
    suggestionPrompt: "Elige cómo quieres practicar hoy:",
    baseSkills: { vocabulary: 32, grammar: 28, pronunciation: 25, comprehension: 38 },
  },
  intermediate: {
    label: "Intermedio",
    emoji: "🚀",
    cefr: "B1–B2",
    color: "#5B21FA",
    bg: "#EEE9FF",
    topic: "Talk about your day",
    topicEs: "Hablar de tu día",
    welcomeMsg:
      "¡Hola! Soy LingoAI, tu tutor con IA. Ya tienes una buena base — hoy trabajaremos fluidez y corrección gramatical. ¿Empezamos con una conversación sobre tu día?",
    suggestionPrompt: "¿Qué quieres practicar hoy?",
    baseSkills: { vocabulary: 58, grammar: 52, pronunciation: 47, comprehension: 61 },
  },
  advanced: {
    label: "Avanzado",
    emoji: "⚡",
    cefr: "C1–C2",
    color: "#F59E0B",
    bg: "#FEF3C7",
    topic: "Debate & nuanced expression",
    topicEs: "Debate y matices",
    welcomeMsg:
      "Hello! I'm LingoAI. Since you're at an advanced level, we'll focus on nuance, idioms and native-like expression. Ready to have a deeper conversation in English?",
    suggestionPrompt: "Pick your focus area:",
    baseSkills: { vocabulary: 78, grammar: 72, pronunciation: 66, comprehension: 80 },
  },
};

export const MODES: { id: ChatMode; label: string; emoji: string; desc: string }[] = [
  { id: "free", label: "Conversación libre", emoji: "💬", desc: "Habla de cualquier tema" },
  { id: "vocabulary", label: "Vocabulario", emoji: "📖", desc: "Aprende palabras nuevas" },
  { id: "grammar", label: "Gramática", emoji: "✏️", desc: "Ejercicios guiados" },
  { id: "pronunciation", label: "Pronunciación", emoji: "🎙️", desc: "Graba y recibe feedback" },
  { id: "exercise", label: "Ejercicio rápido", emoji: "⚡", desc: "Quiz de 3 preguntas" },
];

/* ─── Test de nivelación (onboarding) ─── */

export type PlacementQuestion = {
  prompt: string;
  options: string[];
  correct: number;
  skill: "grammar" | "vocabulary";
};

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    prompt: "I ___ from Colombia.",
    options: ["am", "is", "are", "be"],
    correct: 0,
    skill: "grammar",
  },
  {
    prompt: "She ___ to work every day.",
    options: ["go", "goes", "going", "gone"],
    correct: 1,
    skill: "grammar",
  },
  {
    prompt: "I have lived here ___ 2019.",
    options: ["for", "since", "from", "during"],
    correct: 1,
    skill: "grammar",
  },
  {
    prompt: "If I ___ more time, I would travel around the world.",
    options: ["have", "has", "had", "having"],
    correct: 2,
    skill: "grammar",
  },
  {
    prompt: "The report ___ by the team yesterday.",
    options: ["wrote", "was written", "is written", "has wrote"],
    correct: 1,
    skill: "grammar",
  },
];

export function levelFromScore(score: number): Level {
  if (score <= 1) return "beginner";
  if (score <= 3) return "intermediate";
  return "advanced";
}

/* ─── Ejercicios del quiz dentro del chat ─── */

export type Exercise = {
  q: string;
  opts: string[];
  correct: number;
  explanation: string;
};

export const EXERCISES: Record<Level, Exercise[]> = {
  beginner: [
    {
      q: "Choose the correct option: 'She ___ to the store yesterday.'",
      opts: ["go", "went", "goes", "going"],
      correct: 1,
      explanation: "'Went' es el pasado de 'go' (verbo irregular: go → went → gone).",
    },
    {
      q: "Fill in the blank: 'I ___ a student.'",
      opts: ["is", "am", "are", "be"],
      correct: 1,
      explanation: "Con 'I' siempre usamos 'am': I am / I'm.",
    },
    {
      q: "Which sentence is correct?",
      opts: ["He don't like coffee.", "He doesn't likes coffee.", "He doesn't like coffee.", "He not like coffee."],
      correct: 2,
      explanation: "Tercera persona singular: doesn't + verbo en forma base.",
    },
  ],
  intermediate: [
    {
      q: "Complete: 'I have ___ this movie before.'",
      opts: ["see", "saw", "seen", "seeing"],
      correct: 2,
      explanation: "Con 'have' se usa el participio pasado: 'seen'.",
    },
    {
      q: "Complete: 'By the time she arrived, we ___ dinner.'",
      opts: ["already finished", "had already finished", "have already finished", "were already finishing"],
      correct: 1,
      explanation: "Past perfect para una acción anterior a otra acción pasada.",
    },
    {
      q: "Which is the most natural option?",
      opts: ["I'm looking forward to meet you.", "I look forward to meeting you.", "I'm looking forward meet you.", "I look forward to meet you."],
      correct: 1,
      explanation: "'Look forward to' va seguido de gerundio (-ing).",
    },
  ],
  advanced: [
    {
      q: "Choose the most formal rewrite: 'I wanna talk about the thing that happened.'",
      opts: ["I want to discuss what occurred.", "I wanna talk about it.", "I want talking about the thing.", "I would like talk about that."],
      correct: 0,
      explanation: "Registro formal: 'discuss' + 'what occurred' evita coloquialismos.",
    },
    {
      q: "Pick the correct inversion: 'Never ___ such a compelling argument.'",
      opts: ["I have heard", "have I heard", "I heard", "did I heard"],
      correct: 1,
      explanation: "Tras adverbios negativos al inicio se invierte sujeto y auxiliar.",
    },
    {
      q: "Which collocation is correct?",
      opts: ["make a research", "do a research", "conduct research", "take a research"],
      correct: 2,
      explanation: "'Research' es incontable: 'conduct research' o 'do research'.",
    },
  ],
};

/* ─── Vocabulario por nivel ─── */

export type VocabWord = { word: string; translation: string; example: string };

export const VOCAB_SETS: Record<Level, VocabWord[]> = {
  beginner: [
    { word: "Hello", translation: "Hola", example: "Hello! My name is María." },
    { word: "Thank you", translation: "Gracias", example: "Thank you very much!" },
    { word: "Please", translation: "Por favor", example: "Can you help me, please?" },
    { word: "Yesterday", translation: "Ayer", example: "I went to the park yesterday." },
    { word: "Weekend", translation: "Fin de semana", example: "I relax on the weekend." },
  ],
  intermediate: [
    { word: "Eventually", translation: "Finalmente / Con el tiempo", example: "Eventually, she learned to speak fluently." },
    { word: "Although", translation: "Aunque", example: "Although it was raining, we went out." },
    { word: "Nevertheless", translation: "Sin embargo", example: "It was hard; nevertheless, she succeeded." },
    { word: "Reliable", translation: "Confiable", example: "He is a reliable teammate." },
    { word: "Improve", translation: "Mejorar", example: "I want to improve my pronunciation." },
  ],
  advanced: [
    { word: "Nuance", translation: "Matiz / Sutileza", example: "The nuance of his argument was lost in translation." },
    { word: "Eloquent", translation: "Elocuente", example: "She gave an eloquent speech at the conference." },
    { word: "Ambiguous", translation: "Ambiguo", example: "The law was too ambiguous to enforce." },
    { word: "Compelling", translation: "Convincente / Atractivo", example: "That was a compelling argument." },
    { word: "Notwithstanding", translation: "No obstante", example: "Notwithstanding the risks, they proceeded." },
  ],
};

/** Frases guía para el widget de pronunciación. */
export const PRONUNCIATION_PHRASES: Record<Level, string[]> = {
  beginner: ["The weather is beautiful today.", "I would like a coffee, please.", "My name is María and I am learning English."],
  intermediate: ["I've been working on this project for three weeks.", "Could you explain that again more slowly?", "I would rather stay home than go out tonight."],
  advanced: ["Notwithstanding the setbacks, the team delivered an outstanding result.", "I'd argue that the nuance is often lost in translation.", "Had I known earlier, I would have handled it differently."],
};

/** Flashcards iniciales de ejemplo (se amplían con los errores reales). */
export const SEED_FLASHCARDS: { word: string; definition: string; example: string; fromError: boolean }[] = [
  { word: "went", definition: "past tense of 'go'", example: "I went to the store yesterday.", fromError: true },
  { word: "fluent", definition: "able to speak smoothly and easily", example: "She speaks English fluently.", fromError: false },
  { word: "pronunciation", definition: "the way a word is spoken", example: "Her pronunciation is excellent.", fromError: true },
  { word: "vocabulary", definition: "the set of words you know", example: "Reading expands your vocabulary.", fromError: false },
];

export const TAB_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  chat: "Tutor",
  progress: "Progreso",
  profile: "Perfil",
};
