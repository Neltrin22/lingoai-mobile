import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LEVELS, SEED_FLASHCARDS } from "../data/content";
import type {
  ChatMode,
  Correction,
  Flashcard,
  Level,
  Message,
  Progress,
  SkillKey,
  Skills,
} from "../types";
import { dateKey } from "../utils/dates";
import { DEFAULT_API_URL } from "../services/config";

const STORAGE_KEY = "lingoai.state.v1";

export type AppState = {
  name: string;
  level: Level | null;
  onboarded: boolean;
  messages: Message[];
  progress: Progress;
  flashcards: Flashcard[];
  soundOn: boolean;
  apiUrl: string;
  lastMode: ChatMode | null;
};

function emptyProgress(level: Level | null): Progress {
  const skills: Skills = level
    ? { ...LEVELS[level].baseSkills }
    : { vocabulary: 0, grammar: 0, pronunciation: 0, comprehension: 0 };
  return {
    skills,
    logs: [],
    streak: 0,
    lastStudyDate: null,
    totalWords: 0,
    totalMessages: 0,
    corrections: 0,
    exercisesDone: 0,
    pronunciationTries: 0,
    bestPronunciation: 0,
  };
}

function initialState(): AppState {
  return {
    name: "María",
    level: null,
    onboarded: false,
    messages: [],
    progress: emptyProgress(null),
    flashcards: SEED_FLASHCARDS.map((c, i) => ({
      id: `seed-${i}`,
      createdAt: Date.now() - i * 86_400_000,
      ...c,
    })),
    soundOn: true,
    apiUrl: DEFAULT_API_URL,
    lastMode: null,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function onlyRecentDefined<T>(entries: T[], max: number): T[] {
  return entries.slice(Math.max(0, entries.length - max));
}

export type AppActions = {
  completeOnboarding: (level: Level, name?: string) => void;
  setLevel: (level: Level) => void;
  setName: (name: string) => void;
  appendMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  clearConversation: () => void;
  setLastMode: (mode: ChatMode | null) => void;
  addMinutes: (minutes: number) => void;
  addWords: (count: number) => void;
  bumpSkills: (delta: Partial<Record<SkillKey, number>>) => void;
  countMessage: () => void;
  recordCorrection: (correction: Correction) => void;
  recordExercise: (score: number, total: number) => void;
  recordPronunciation: (score: number) => void;
  addFlashcards: (cards: Omit<Flashcard, "id" | "createdAt">[]) => void;
  setSoundOn: (on: boolean) => void;
  setApiUrl: (url: string) => void;
  resetAll: () => void;
};

type AppContextValue = {
  state: AppState;
  hydrated: boolean;
  actions: AppActions;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Carga inicial desde disco ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          setState((prev) => ({
            ...prev,
            ...parsed,
            progress: { ...prev.progress, ...(parsed.progress ?? {}) },
            messages: parsed.messages ?? prev.messages,
            flashcards: parsed.flashcards ?? prev.flashcards,
          }));
        }
      } catch (error) {
        console.warn("[LingoAI] No se pudo leer el estado guardado", error);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Guardado con debounce ── */
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
        console.warn("[LingoAI] No se pudo guardar el estado", error),
      );
    }, 350);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated]);

  const bumpSkills = useCallback((delta: Partial<Record<SkillKey, number>>) => {
    setState((prev) => {
      const skills = { ...prev.progress.skills };
      (Object.keys(delta) as SkillKey[]).forEach((key) => {
        skills[key] = clamp(skills[key] + (delta[key] ?? 0));
      });
      return { ...prev, progress: { ...prev.progress, skills } };
    });
  }, []);

  const touchStudyDay = (progress: Progress): Progress => {
    const today = dateKey();
    if (progress.lastStudyDate === today) return progress;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = progress.lastStudyDate === dateKey(yesterday);

    return {
      ...progress,
      streak: isConsecutive ? progress.streak + 1 : 1,
      lastStudyDate: today,
    };
  };

  const logToday = (progress: Progress, patch: { minutes?: number; words?: number; messages?: number }): Progress => {
    const today = dateKey();
    const logs = [...progress.logs];
    const index = logs.findIndex((log) => log.date === today);
    const current = index >= 0 ? logs[index] : { date: today, minutes: 0, words: 0, messages: 0 };
    const updated = {
      ...current,
      minutes: Math.round((current.minutes + (patch.minutes ?? 0)) * 10) / 10,
      words: current.words + (patch.words ?? 0),
      messages: current.messages + (patch.messages ?? 0),
    };
    if (index >= 0) logs[index] = updated;
    else logs.push(updated);
    return { ...progress, logs: onlyRecentDefined(logs, 60) };
  };

  const actions = useMemo<AppActions>(
    () => ({
      completeOnboarding: (level, name) =>
        setState((prev) => ({
          ...prev,
          level,
          name: name?.trim() ? name.trim() : prev.name,
          onboarded: true,
          progress: { ...emptyProgress(level), streak: 1, lastStudyDate: dateKey() },
          messages: [],
          lastMode: null,
        })),

      setLevel: (level) =>
        setState((prev) => ({
          ...prev,
          level,
          progress: {
            ...prev.progress,
            skills: { ...LEVELS[level].baseSkills },
          },
        })),

      setName: (name) => setState((prev) => ({ ...prev, name })),

      appendMessage: (message) =>
        setState((prev) => ({
          ...prev,
          messages: onlyRecentDefined([...prev.messages, message], 120),
        })),

      updateMessage: (id, patch) =>
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
        })),

      clearConversation: () => setState((prev) => ({ ...prev, messages: [], lastMode: null })),

      setLastMode: (mode) => setState((prev) => ({ ...prev, lastMode: mode })),

      addMinutes: (minutes) =>
        setState((prev) => ({
          ...prev,
          progress: logToday(touchStudyDay(prev.progress), { minutes }),
        })),

      addWords: (count) =>
        setState((prev) => ({
          ...prev,
          progress: logToday(
            { ...prev.progress, totalWords: prev.progress.totalWords + count },
            { words: count },
          ),
        })),

      bumpSkills,

      countMessage: () =>
        setState((prev) => ({
          ...prev,
          progress: logToday(
            { ...prev.progress, totalMessages: prev.progress.totalMessages + 1 },
            { messages: 1 },
          ),
        })),

      recordCorrection: (correction) =>
        setState((prev) => {
          const progress = {
            ...prev.progress,
            corrections: prev.progress.corrections + 1,
            skills: { ...prev.progress.skills, grammar: clamp(prev.progress.skills.grammar + 1) },
          };
          const word = correction.word?.trim();
          if (!word) return { ...prev, progress };

          const existing = prev.flashcards.find(
            (card) => card.word.toLowerCase() === word.toLowerCase(),
          );
          const card: Flashcard = {
            id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            word,
            definition: correction.definition || correction.explanation,
            example: correction.example,
            fromError: true,
            createdAt: Date.now(),
          };
          return {
            ...prev,
            progress,
            flashcards: existing
              ? prev.flashcards.map((item) => (item.id === existing.id ? { ...item, ...card, id: item.id } : item))
              : [card, ...prev.flashcards].slice(0, 60),
          };
        }),

      recordExercise: (score, total) =>
        setState((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            exercisesDone: prev.progress.exercisesDone + 1,
            skills: {
              ...prev.progress.skills,
              grammar: clamp(prev.progress.skills.grammar + (score / Math.max(total, 1)) * 2),
              comprehension: clamp(prev.progress.skills.comprehension + 0.5),
            },
          },
        })),

      recordPronunciation: (score) =>
        setState((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            pronunciationTries: prev.progress.pronunciationTries + 1,
            bestPronunciation: Math.max(prev.progress.bestPronunciation, score),
            skills: {
              ...prev.progress.skills,
              pronunciation: clamp(
                prev.progress.skills.pronunciation + (score >= 80 ? 1.5 : score >= 60 ? 0.8 : 0.3),
              ),
            },
          },
        })),

      addFlashcards: (cards) =>
        setState((prev) => {
          const byWord = new Map(prev.flashcards.map((card) => [card.word.toLowerCase(), card]));
          cards.forEach((card) => {
            const key = card.word.toLowerCase();
            if (!byWord.has(key)) {
              byWord.set(key, {
                ...card,
                id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                createdAt: Date.now(),
              });
            }
          });
          const next = Array.from(byWord.values()).sort((a, b) => b.createdAt - a.createdAt);
          return { ...prev, flashcards: next.slice(0, 60) };
        }),

      setSoundOn: (on) => setState((prev) => ({ ...prev, soundOn: on })),

      setApiUrl: (url) => setState((prev) => ({ ...prev, apiUrl: url })),

      resetAll: () => setState({ ...initialState(), apiUrl: state.apiUrl }),
    }),
    [bumpSkills, state.apiUrl],
  );

  const value = useMemo(() => ({ state, hydrated, actions }), [state, hydrated, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp debe usarse dentro de AppProvider");
  return context;
}

export function useLevel(): Level {
  const { state } = useApp();
  return state.level ?? "beginner";
}
