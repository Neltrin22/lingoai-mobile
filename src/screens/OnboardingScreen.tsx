import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LEVELS, PLACEMENT_QUESTIONS, levelFromScore } from "../data/content";
import { colors, fonts, radius, heroShadow } from "../theme";
import type { Level } from "../types";
import { LevelPicker } from "../components/LevelBadge";
import { ProgressBar } from "../components/Progress";
import { Txt } from "../components/Txt";
import { PrimaryButton } from "../components/ui";

export function OnboardingScreen({
  onDone,
}: {
  onDone: (level: Level, name: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [detected, setDetected] = useState<Level>("intermediate");
  const [manual, setManual] = useState(false);
  const [manualLevel, setManualLevel] = useState<Level>("beginner");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);

  const total = PLACEMENT_QUESTIONS.length;
  const question = step >= 1 && step <= total ? PLACEMENT_QUESTIONS[step - 1] : null;
  const finalName = name.trim() || "Estudiante";

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const answer = (option: number) => {
    if (!question || selected !== null) return;
    setSelected(option);

    if (option === question.correct) scoreRef.current += 1;

    timer.current = setTimeout(() => {
      setSelected(null);
      if (step < total) {
        setStep(step + 1);
      } else {
        setScore(scoreRef.current);
        const level = levelFromScore(scoreRef.current);
        setDetected(level);
        setManualLevel(level);
        setStep(total + 1);
      }
    }, 700);
  };

  /* ── Resultado ── */
  if (step === total + 1) {
    const config = LEVELS[manualLevel];
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.resultIcon}>
          <Txt size={38}>{config.emoji}</Txt>
        </View>
        <Txt size={22} weight="extraBold" center>
          Tu nivel es {config.label}
        </Txt>
        <Txt size={12.5} color={colors.textSecondary} center style={{ marginTop: 6, lineHeight: 18 }}>
          {detected === manualLevel
            ? `Acertaste ${score} de ${total}. Tu tutor adaptará el vocabulario y las correcciones a ${config.cefr}.`
            : "Ajustaste tu nivel manualmente. Tu tutor adaptará el contenido a tu elección."}
        </Txt>

        <View style={styles.divider} />

        <Txt size={12} weight="bold" color={colors.textSecondary} style={{ marginBottom: 8 }}>
          Ajusta tu nivel si lo necesitas
        </Txt>
        <LevelPicker value={manualLevel} onChange={setManualLevel} />

        <PrimaryButton
          label="Comenzar con tutor IA"
          onPress={() => onDone(manualLevel, finalName)}
          style={{ marginTop: 22 }}
        />
        <Pressable
          onPress={() => {
            setStep(0);
            setScore(0);
            setSelected(null);
            scoreRef.current = 0;
          }}
          style={{ marginTop: 14, alignSelf: "center" }}
        >
          <Txt size={12} color={colors.textMuted}>Repetir el test</Txt>
        </Pressable>
      </ScrollView>
    );
  }

  /* ── Preguntas ── */
  if (question && !manual) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressRow}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={((step - 1) / total) * 100} color={colors.primary} />
          </View>
          <Txt size={11.5} weight="semiBold" color={colors.textSecondary}>
            {step}/{total}
          </Txt>
        </View>

        <Txt size={11} weight="bold" color={colors.primary} style={{ marginTop: 22 }}>
          DIAGNÓSTICO DE NIVEL
        </Txt>
        <Txt size={22} weight="extraBold" style={{ marginTop: 8, lineHeight: 29 }}>
          {question.prompt}
        </Txt>
        <Txt size={12} color={colors.textSecondary} style={{ marginTop: 7 }}>
          Elige la opción correcta. No hay penalización por equivocarse.
        </Txt>

        <View style={{ gap: 10, marginTop: 22 }}>
          {question.options.map((option, index) => {
            const revealed = selected !== null;
            const isCorrect = index === question.correct;
            const isSelected = selected === index;
            const background = revealed
              ? isCorrect
                ? colors.accentSurface
                : isSelected
                  ? colors.dangerSurface
                  : colors.background
              : colors.background;
            const borderColor = revealed
              ? isCorrect
                ? colors.accent
                : isSelected
                  ? colors.danger
                  : colors.border
              : colors.border;

            return (
              <Pressable
                key={index}
                onPress={() => answer(index)}
                disabled={revealed}
                style={[styles.option, { backgroundColor: background, borderColor }]}
              >
                <View style={[styles.optionLetter, { borderColor }]}>
                  <Txt
                    size={11}
                    weight="bold"
                    color={revealed && isCorrect ? colors.accentDark : colors.textSecondary}
                  >
                    {revealed && isCorrect ? "✓" : String.fromCharCode(65 + index)}
                  </Txt>
                </View>
                <Txt size={14} weight="medium" style={{ flex: 1 }}>
                  {option}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => setManual(true)} style={{ marginTop: 24, alignSelf: "center" }}>
          <Txt size={12} color={colors.textMuted}>Prefiero elegir mi nivel manualmente</Txt>
        </Pressable>
      </ScrollView>
    );
  }

  /* ── Selección manual ── */
  if (manual) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Txt size={22} weight="extraBold">{"¿Cuál es tu nivel de inglés?"}</Txt>
        <Txt size={12.5} color={colors.textSecondary} style={{ marginTop: 6, marginBottom: 20 }}>
          Elige cómo quieres empezar con tu tutor.
        </Txt>
        <LevelPicker value={manualLevel} onChange={setManualLevel} />
        <PrimaryButton
          label="Comenzar con tutor IA"
          onPress={() => onDone(manualLevel, finalName)}
          style={{ marginTop: 22 }}
        />
        <Pressable
          onPress={() => setManual(false)}
          style={{ marginTop: 14, alignSelf: "center" }}
        >
          <Txt size={12} color={colors.textMuted}>Volver al diagnóstico</Txt>
        </Pressable>
      </ScrollView>
    );
  }

  /* ── Bienvenida ── */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBlob} />
          <View style={styles.heroBlobSmall} />
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Txt size={20}>🧠</Txt>
            </View>
            <Txt size={20} weight="extraBold" color={colors.white}>
              LingoAI
            </Txt>
          </View>
          <Txt size={26} weight="extraBold" color={colors.white} style={{ marginTop: 26, lineHeight: 34 }}>
            Inglés sin miedo,{"\n"}todos los días.
          </Txt>
          <Txt size={12.5} color="rgba(255,255,255,0.82)" style={{ marginTop: 8, lineHeight: 19 }}>
            Tu tutor personal con IA, disponible 24/7 para conversar, corregirte y
            medir tu progreso.
          </Txt>
        </LinearGradient>

        <View style={{ marginTop: 24 }}>
          <Txt size={12} weight="bold" color={colors.textSecondary}>
            ¿CÓMO TE LLAMAS?
          </Txt>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={28}
            returnKeyType="done"
          />
        </View>

        <View style={{ gap: 12, marginTop: 22 }}>
          {[
            { icon: "chatbubbles-outline", title: "Conversaciones reales", desc: "Practica situaciones cotidianas con retroalimentación inmediata." },
            { icon: "mic-outline", title: "Voz y pronunciación", desc: "Graba tu voz y recibe un puntaje con las palabras a mejorar." },
            { icon: "stats-chart-outline", title: "Progreso medible", desc: "Rachas, metas y flashcards generadas de tus propios errores." },
          ].map((item) => (
            <View key={item.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={13} weight="bold">{item.title}</Txt>
                <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 2, lineHeight: 16 }}>
                  {item.desc}
                </Txt>
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton
          label="Empezar diagnóstico"
          onPress={() => setStep(1)}
          style={{ marginTop: 24 }}
        />
        <Pressable onPress={() => setManual(true)} style={{ marginTop: 14, alignSelf: "center" }}>
          <Txt size={12} color={colors.textMuted}>Ya conozco mi nivel</Txt>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 22,
    paddingBottom: 40,
    flexGrow: 1,
  },
  hero: {
    borderRadius: 26,
    padding: 22,
    overflow: "hidden",
    ...heroShadow,
  },
  heroBlob: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroBlobSmall: {
    position: "absolute",
    right: 30,
    bottom: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  feature: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 22,
  },
});
