import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LevelBadge } from "../components/LevelBadge";
import { Txt } from "../components/Txt";
import { TypingDots } from "../components/TypingDots";
import { Chip, SecondaryButton } from "../components/ui";
import { ExerciseWidget } from "../components/widgets/ExerciseWidget";
import { PronunciationWidget } from "../components/widgets/PronunciationWidget";
import { VocabularyWidget } from "../components/widgets/VocabularyWidget";
import { LEVELS, MODES } from "../data/content";
import { useRecorder } from "../hooks/useRecorder";
import { useStudyTimer } from "../hooks/useStudyTimer";
import { transcribeAudio, sendTutorMessage } from "../services/api";
import { speakEnglish, stopSpeaking } from "../services/speech";
import { useApp } from "../state/store";
import { colors, fonts, radius } from "../theme";
import type { ChatEntry, ChatMode, Message } from "../types";
import { uid } from "../utils/id";

const MODE_INTROS: Record<ChatMode, string> = {
  free: "¡Genial! Hablamos libremente en inglés y te corrijo cuando sea necesario. Cuéntame, ¿cómo estuvo tu día? 😊",
  vocabulary:
    "¡Perfecto! Aquí tienes palabras nuevas adaptadas a tu nivel. Toca cada tarjeta para ver la traducción y el ejemplo.",
  grammar:
    "Vamos a practicar gramática. Te propongo una estructura y tú respondes en inglés — te corrijo al instante.",
  pronunciation:
    "¡Trabajemos tu pronunciación! Escucha la frase, graba tu voz y te doy un puntaje con las palabras a mejorar.",
  exercise:
    "¡Quiz rápido! Tres preguntas de gramática. Elige la respuesta correcta y te explico cada error. ¡Empezamos! 🚀",
};

const GRAMMAR_PROMPTS: Record<string, string> = {
  beginner: "¿Cómo se dice «Yo fui al mercado ayer» en inglés? Inténtalo ✍️",
  intermediate:
    "Completa: 'By the time she arrived, we ___ (already / finish) dinner.' Usa el tiempo verbal correcto.",
  advanced:
    "Reescribe en un registro más formal: 'I wanna talk about the thing that happened last week.'",
};

const BUBBLE_MAX = "78%";

export function ChatScreen({ onOpenProgress }: { onOpenProgress: () => void }) {
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const level = state.level ?? "beginner";
  const config = LEVELS[level];

  const [input, setInput] = useState("");
  const [showModes, setShowModes] = useState(state.messages.length === 0);
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [forceVoice, setForceVoice] = useState(false);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const spokenId = useRef<string | null>(null);
  const initialized = useRef(false);
  const voice = useRecorder();

  const activeMode: ChatMode = state.lastMode ?? "free";
  const activeModeLabel = MODES.find((mode) => mode.id === activeMode)?.label ?? "Conversación libre";

  useStudyTimer(true, actions.addMinutes);

  /* ── Mensaje de bienvenida ── */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (state.messages.length === 0) {
      actions.appendMessage({ id: uid("welcome"), role: "ai", text: config.welcomeMsg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Lectura en voz alta de las respuestas nuevas ── */
  const lastMessage = state.messages[state.messages.length - 1];
  useEffect(() => {
    if (!lastMessage || lastMessage.role !== "ai" || !lastMessage.text) return;
    if (spokenId.current === null) {
      spokenId.current = lastMessage.id;
      return;
    }
    if (spokenId.current === lastMessage.id) return;
    spokenId.current = lastMessage.id;
    if (state.soundOn) speakEnglish(lastMessage.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, state.soundOn]);

  /* ── Auto-scroll fiable al llegar mensajes o widgets ── */
  useEffect(() => {
    const quick = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    const settle = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 450);
    return () => {
      clearTimeout(quick);
      clearTimeout(settle);
    };
  }, [state.messages.length, sending]);

  const addAi = (message: Omit<Message, "id" | "role">) =>
    actions.appendMessage({ id: uid("ai"), role: "ai", ...message });

  const selectMode = (mode: ChatMode) => {
    actions.setLastMode(mode);
    setShowModes(false);
    addAi({ text: MODE_INTROS[mode] });

    if (mode === "vocabulary" || mode === "pronunciation" || mode === "exercise") {
      actions.appendMessage({ id: uid("widget"), role: "ai", text: "", widget: mode });
    }
    if (mode === "grammar") {
      addAi({ text: GRAMMAR_PROMPTS[level] });
    }
  };

  const send = async (raw?: string) => {
    const content = (raw ?? input).trim();
    if (!content || sending) return;

    actions.appendMessage({ id: uid("user"), role: "user", text: content });
    actions.countMessage();
    actions.setLastMode(activeMode);
    setInput("");
    setShowModes(false);
    setSending(true);
    setBanner(null);

    const history: ChatEntry[] = state.messages
      .filter((message) => message.text.trim().length > 0)
      .map((message) => ({
        role: message.role === "ai" ? "assistant" : "user",
        content: message.text,
      }));

    try {
      const reply = await sendTutorMessage({
        baseUrl: state.apiUrl,
        message: content,
        level,
        mode: activeMode ?? "free",
        history,
        name: state.name,
      });

      addAi({ text: reply.reply, correction: reply.correction, provider: reply.provider });

      if (reply.correction) actions.recordCorrection(reply.correction);
      if (reply.vocabulary.length > 0) {
        actions.addFlashcards(
          reply.vocabulary.map((word) => ({
            word: word.word,
            definition: word.translation,
            example: word.example,
            fromError: false,
          })),
        );
        actions.addWords(reply.vocabulary.length);
      }
      actions.bumpSkills({
        comprehension: 0.4,
        grammar: reply.correction ? 0.15 : 0.3,
      });

      if (reply.provider === "demo") {
        setBanner("Sin conexión con el backend: el tutor está respondiendo en modo local.");
      }
    } catch {
      addAi({ text: "No pude obtener respuesta del tutor. Revisa tu conexión e intenta de nuevo." });
      setBanner("No se pudo contactar el backend.");
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    setBanner(null);

    if (!voice.isRecording) {
      await voice.start();
      return;
    }

    const uri = await voice.stop();
    if (!uri) return;

    setTranscribing(true);
    try {
      const { text } = await transcribeAudio(state.apiUrl, uri);
      if (text.length > 0) {
        await send(text);
      } else {
        setBanner("No entendí el audio. Intenta hablar un poco más cerca del micrófono.");
      }
    } catch {
      setBanner("La transcripción de voz necesita el backend activo (revisa la URL en Perfil).");
    } finally {
      setTranscribing(false);
    }
  };

  const confirmClear = () => {
    Alert.alert("Nueva conversación", "Se borrará el historial de este chat (tu progreso se conserva).", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Empezar de nuevo",
        style: "destructive",
        onPress: () => {
          actions.clearConversation();
          setShowModes(true);
          setExpanded(null);
          addAi({ text: config.welcomeMsg });
        },
      },
    ]);
  };

  const quickReplies = showModes
    ? []
    : activeMode === "free"
      ? [
          { label: "¡Entendido! Gracias.", action: () => send("¡Entendido! Gracias.") },
          { label: "Dame otro ejemplo.", action: () => send("Can you give me another example?") },
          { label: "Explícamelo mejor.", action: () => send("Can you explain that again more clearly?") },
          { label: "Cambiar actividad 🔄", action: () => setShowModes(true) },
        ]
      : [
          { label: "Cambiar actividad 🔄", action: () => setShowModes(true) },
          { label: "Ver mi progreso 📊", action: onOpenProgress },
        ];

  const recording = voice.isRecording;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Txt size={18}>🤖</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={14.5} weight="bold">LingoAI Tutor</Txt>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Txt size={10.5} weight="semiBold" color={colors.accentDark}>En línea</Txt>
              <Txt size={10.5} color={colors.textMuted} numberOfLines={1}>
                · {config.cefr} · {activeModeLabel}
              </Txt>
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (state.soundOn) stopSpeaking();
              actions.setSoundOn(!state.soundOn);
            }}
            hitSlop={8}
            accessibilityLabel={state.soundOn ? "Silenciar tutor" : "Activar voz del tutor"}
            style={styles.iconButton}
          >
            <Ionicons
              name={state.soundOn ? "volume-high-outline" : "volume-mute-outline"}
              size={19}
              color={state.soundOn ? colors.primary : colors.textMuted}
            />
          </Pressable>
          <Pressable onPress={confirmClear} hitSlop={8} accessibilityLabel="Nueva conversación" style={styles.iconButton}>
            <Ionicons name="refresh-outline" size={19} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.headerBottom}>
          <LevelBadge level={level} />
          <Txt size={10.5} color={colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
            Tema: {config.topic}
          </Txt>
        </View>
      </View>

      {banner ? (
        <Pressable onPress={() => setBanner(null)} style={styles.banner}>
          <Ionicons name="information-circle-outline" size={15} color={colors.warningText} />
          <Txt size={10.5} color={colors.warningText} style={{ flex: 1 }}>{banner}</Txt>
          <Ionicons name="close" size={13} color={colors.warningText} />
        </Pressable>
      ) : null}

      {/* ── Mensajes ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 8, gap: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {state.messages.map((message) => {
          if (message.widget) {
            return (
              <View key={message.id} style={{ marginLeft: 34 }}>
                {message.widget === "exercise" ? (
                  <ExerciseWidget
                    level={level}
                    onFinish={(score, total) => {
                      actions.recordExercise(score, total);
                      addAi({
                        text: `¡Terminaste el quiz! Obtuviste ${score}/${total}. ${
                          score === total ? "¡Perfecto! 🏆" : "Revisa las explicaciones y sigue practicando 💪"
                        }`,
                      });
                    }}
                  />
                ) : null}
                {message.widget === "vocabulary" ? (
                  <VocabularyWidget
                    level={level}
                    onLearned={(word) => {
                      actions.addWords(1);
                      actions.bumpSkills({ vocabulary: 0.6 });
                      actions.addFlashcards([
                        {
                          word: word.word,
                          definition: word.translation,
                          example: word.example,
                          fromError: false,
                        },
                      ]);
                    }}
                  />
                ) : null}
                {message.widget === "pronunciation" ? (
                  <PronunciationWidget
                    level={level}
                    baseUrl={state.apiUrl}
                    onScore={(score) => actions.recordPronunciation(score)}
                  />
                ) : null}
              </View>
            );
          }

          if (message.role === "user") {
            return (
              <View key={message.id} style={{ alignItems: "flex-end" }}>
                <View style={styles.userBubble}>
                  <Txt size={13.5} color={colors.white} style={{ lineHeight: 20 }}>
                    {message.text}
                  </Txt>
                </View>
              </View>
            );
          }

          return (
            <View key={message.id} style={{ maxWidth: "94%", gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 7 }}>
                <View style={styles.aiAvatar}>
                  <Txt size={12}>🤖</Txt>
                </View>
                <View style={styles.aiBubble}>
                  <Txt size={13.5} style={{ lineHeight: 20 }}>
                    {message.text.replace(/\*\*/g, "")}
                  </Txt>
                </View>
                {message.text.length > 0 ? (
                  <Pressable
                    onPress={() => speakEnglish(message.text)}
                    hitSlop={8}
                    accessibilityLabel="Escuchar mensaje"
                  >
                    <Ionicons name="volume-medium-outline" size={16} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              {message.correction ? (
                <View style={{ marginLeft: 34 }}>
                  <View style={styles.correctionCard}>
                    <Pressable
                      onPress={() => setExpanded(expanded === message.id ? null : message.id)}
                      style={styles.correctionHeader}
                    >
                      <Txt size={11.5} weight="bold" color={colors.warningText} style={{ flex: 1 }}>
                        {message.correction.status}
                      </Txt>
                      <Ionicons
                        name={expanded === message.id ? "chevron-up" : "chevron-down"}
                        size={15}
                        color={colors.warningText}
                      />
                    </Pressable>
                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <Ionicons name="create-outline" size={14} color={colors.text} style={{ marginTop: 2 }} />
                        <Txt size={12.5} weight="medium" style={{ flex: 1, lineHeight: 19 }}>
                          {message.correction.fix}
                        </Txt>
                      </View>
                      {expanded === message.id ? (
                        <View style={styles.correctionBody}>
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            <Ionicons name="book-outline" size={13} color={colors.textSecondary} style={{ marginTop: 2 }} />
                            <Txt size={11.5} color={colors.textSecondary} style={{ flex: 1, lineHeight: 17 }}>
                              {message.correction.explanation}
                            </Txt>
                          </View>
                          <View style={styles.exampleBox}>
                            <Txt size={11.5} color="#065F46" weight="semiBold" style={{ lineHeight: 17 }}>
                              Ejemplo: <Txt size={11.5} color="#065F46" style={{ fontStyle: "italic" }}>{message.correction.example}</Txt>
                            </Txt>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* Selector de modo */}
        {showModes ? (
          <View style={styles.modeCard}>
            <Txt size={10.5} weight="bold" color={colors.textSecondary} style={styles.modeTitle}>
              {config.suggestionPrompt.toUpperCase()}
            </Txt>
            <View style={{ gap: 8 }}>
              {MODES.map((mode) => (
                <Pressable
                  key={mode.id}
                  onPress={() => selectMode(mode.id)}
                  style={({ pressed }) => [
                    styles.modeOption,
                    pressed ? { borderColor: colors.primary, backgroundColor: colors.primarySurface } : null,
                  ]}
                >
                  <Txt size={19}>{mode.emoji}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt size={12.5} weight="bold">{mode.label}</Txt>
                    <Txt size={10.5} color={colors.textMuted}>{mode.desc}</Txt>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {(sending || transcribing) && (
          <View style={styles.typingRow}>
            <View style={styles.aiAvatar}>
              <Txt size={12}>🤖</Txt>
            </View>
            <View style={[styles.aiBubble, { paddingVertical: 10, paddingHorizontal: 14 }]}>
              <TypingDots />
            </View>
            {transcribing ? (
              <Txt size={10.5} color={colors.textMuted}>transcribiendo…</Txt>
            ) : null}
          </View>
        )}

        {quickReplies.length > 0 ? (
          <View style={styles.quickReplies}>
            {quickReplies.map((reply) => (
              <Chip key={reply.label} label={reply.label} onPress={reply.action} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* ── Barra de entrada ── */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
        {recording ? (
          <View style={styles.recordingPanel}>
            <View style={styles.recordingDot} />
            <Txt size={12} weight="semiBold" color={colors.danger}>
              Grabando {(voice.durationMillis / 1000).toFixed(1)}s
            </Txt>
            <View style={{ flex: 1 }} />
            <SecondaryButton label="Detener" icon="stop" onPress={toggleRecording} />
          </View>
        ) : (
          <View style={styles.inputRow}>
            <Pressable
              onPress={toggleRecording}
              disabled={transcribing || sending}
              accessibilityLabel="Grabar mensaje de voz"
              style={[styles.micButton, (transcribing || sending) && { opacity: 0.5 }]}
            >
              <Ionicons name="mic-outline" size={20} color={colors.primary} />
            </Pressable>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={forceVoice ? "Habla o escribe…" : "Escribe en inglés…"}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              maxLength={500}
              onFocus={() => setForceVoice(false)}
            />

            <Pressable
              onPress={() => send()}
              disabled={input.trim().length === 0 || sending}
              accessibilityLabel="Enviar mensaje"
              style={[
                styles.sendButton,
                { opacity: input.trim().length === 0 || sending ? 0.4 : 1 },
              ]}
            >
              <Ionicons name="send" size={17} color={colors.white} />
            </Pressable>
          </View>
        )}

        <Txt size={9.5} color={colors.textMuted} center style={{ marginTop: 6 }}>
          {state.soundOn ? "🔊 Respuestas en voz alta activadas" : "🔇 Voz del tutor desactivada"}
          {"  ·  "}
          LingoAI puede equivocarse, verifica las correcciones.
        </Txt>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 9,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.warningSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  userBubble: {
    maxWidth: BUBBLE_MAX,
    backgroundColor: colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  aiAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiBubble: {
    maxWidth: BUBBLE_MAX,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  correctionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: "hidden",
  },
  correctionHeader: {
    backgroundColor: colors.warningSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  correctionBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 8,
  },
  exampleBox: {
    backgroundColor: colors.accentSurface,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  modeCard: {
    marginLeft: 34,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  modeTitle: {
    letterSpacing: 0.4,
    marginBottom: 9,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
  },
  quickReplies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: radius.md,
    padding: 10,
    minHeight: 46,
  },
  recordingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
});
