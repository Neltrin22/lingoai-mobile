import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { PRONUNCIATION_PHRASES } from "../../data/content";
import { useRecorder } from "../../hooks/useRecorder";
import { ApiUnavailableError, scorePronunciation } from "../../services/api";
import { speakEnglish } from "../../services/speech";
import { colors, radius } from "../../theme";
import type { Level, PronunciationResult } from "../../types";
import { CircularProgress } from "../Progress";
import { Txt } from "../Txt";
import { Card, SecondaryButton } from "../ui";
import { TypingDots } from "../TypingDots";

type Stage = "idle" | "recording" | "analyzing" | "result";

export function PronunciationWidget({
  level,
  baseUrl,
  onScore,
}: {
  level: Level;
  baseUrl: string;
  onScore: (score: number) => void;
}) {
  const phrases = PRONUNCIATION_PHRASES[level];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRecorder();
  const pulse = useRef(new Animated.Value(1)).current;

  const phrase = phrases[phraseIndex % phrases.length];

  useEffect(() => {
    if (!recorder.isRecording) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 620, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 620, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [recorder.isRecording, pulse]);

  const handleTap = async () => {
    setError(null);
    if (stage === "recording") {
      const uri = await recorder.stop();
      if (!uri) {
        setStage("idle");
        setError("No se generó el audio. Intenta otra vez.");
        return;
      }
      setStage("analyzing");
      try {
        const evaluation = await scorePronunciation(baseUrl, uri, phrase);
        setResult(evaluation);
        setStage("result");
        onScore(evaluation.score);
      } catch (err) {
        setStage("idle");
        setError(
          err instanceof ApiUnavailableError
            ? "El análisis de voz necesita el backend activo (revisa la URL en Perfil)."
            : "No pude analizar el audio. Intenta de nuevo.",
        );
      }
      return;
    }

    const started = await recorder.start();
    if (started) setStage("recording");
  };

  const nextPhrase = () => {
    setPhraseIndex((value) => value + 1);
    setResult(null);
    setStage("idle");
    setError(null);
  };

  return (
    <Card style={styles.card} padded={false}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Txt size={10.5} weight="bold" color={colors.pink}>
              🎙️ Pronunciación
            </Txt>
          </View>
          <Pressable onPress={() => speakEnglish(phrase, { rate: 0.82 })} hitSlop={8}>
            <Ionicons name="volume-high-outline" size={19} color={colors.pink} />
          </Pressable>
        </View>

        <Txt size={14} weight="bold" style={{ marginTop: 11 }}>
          "{phrase}"
        </Txt>
        <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 4, marginBottom: 14 }}>
          Escucha el modelo, graba tu voz y compara.
        </Txt>

        {stage === "analyzing" ? (
          <View style={styles.analyzing}>
            <TypingDots color={colors.pink} />
            <Txt size={11.5} color={colors.textSecondary}>
              Analizando tu pronunciación…
            </Txt>
          </View>
        ) : result ? (
          <View>
            <View style={styles.resultRow}>
              <CircularProgress value={result.score} size={72} stroke={7} color={colors.pink}>
                <Txt size={17} weight="extraBold" color={colors.pink}>
                  {result.score}%
                </Txt>
              </CircularProgress>
              <View style={{ flex: 1 }}>
                <Txt size={13} weight="bold" color={result.score >= 75 ? colors.accentDark : colors.warningText}>
                  {result.score >= 85
                    ? "¡Excelente pronunciación!"
                    : result.score >= 70
                      ? "¡Muy bien!"
                      : result.score >= 50
                        ? "Buen intento"
                        : "Sigue practicando"}
                </Txt>
                <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 3, lineHeight: 16 }}>
                  {result.feedback}
                </Txt>
              </View>
            </View>

            {result.transcript ? (
              <View style={styles.transcript}>
                <Txt size={10.5} color={colors.textMuted}>
                  Lo que entendí:
                </Txt>
                <Txt size={11.5} color={colors.text} style={{ marginTop: 2 }}>
                  {result.transcript}
                </Txt>
              </View>
            ) : null}

            {result.words.length > 0 ? (
              <View style={styles.words}>
                {result.words.map((word, index) => (
                  <View
                    key={`${word.word}-${index}`}
                    style={[
                      styles.wordChip,
                      {
                        borderColor: word.ok ? colors.accent : colors.warningBorder,
                        backgroundColor: word.ok ? colors.white : colors.warningSurface,
                      },
                    ]}
                  >
                    <Txt
                      size={10.5}
                      weight="semiBold"
                      color={word.ok ? colors.accentDark : colors.warningText}
                    >
                      {word.word}
                    </Txt>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.actions}>
              <SecondaryButton label="Repetir frase" icon="refresh" onPress={() => { setResult(null); setStage("idle"); }} />
              <SecondaryButton label="Otra frase" icon="arrow-forward" onPress={nextPhrase} />
            </View>
          </View>
        ) : (
          <View style={styles.recordArea}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Pressable
                onPress={handleTap}
                disabled={recorder.busy}
                accessibilityRole="button"
                accessibilityLabel={stage === "recording" ? "Detener grabación" : "Grabar pronunciación"}
                style={[
                  styles.micButton,
                  {
                    backgroundColor: stage === "recording" ? colors.danger : colors.pink,
                    shadowColor: stage === "recording" ? colors.danger : colors.pink,
                  },
                ]}
              >
                <Ionicons
                  name={stage === "recording" ? "stop" : "mic"}
                  size={26}
                  color={colors.white}
                />
              </Pressable>
            </Animated.View>
            <Txt
              size={11.5}
              weight={stage === "recording" ? "bold" : "regular"}
              color={stage === "recording" ? colors.danger : colors.textSecondary}
            >
              {stage === "recording"
                ? `Grabando… ${(recorder.durationMillis / 1000).toFixed(1)}s — toca para detener`
                : "Toca para grabar"}
            </Txt>
          </View>
        )}

        {recorder.error ? (
          <Txt size={11} color={colors.danger} style={{ marginTop: 8 }}>
            {recorder.error}
          </Txt>
        ) : null}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.warningText} />
            <Txt size={11} color={colors.warningText} style={{ flex: 1, lineHeight: 15 }}>
              {error}
            </Txt>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "rgba(236,72,153,0.35)",
    borderWidth: 1.5,
  },
  body: {
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: colors.pinkSurface,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  analyzing: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 18,
  },
  recordArea: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  micButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  transcript: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 9,
  },
  words: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  wordChip: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  errorBox: {
    flexDirection: "row",
    gap: 7,
    alignItems: "flex-start",
    marginTop: 10,
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radius.sm,
    padding: 9,
  },
});
