import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EXERCISES } from "../../data/content";
import { colors, radius } from "../../theme";
import type { Level } from "../../types";
import { Txt } from "../Txt";
import { Card, PrimaryButton } from "../ui";

export function ExerciseWidget({
  level,
  onFinish,
}: {
  level: Level;
  onFinish: (score: number, total: number) => void;
}) {
  const questions = EXERCISES[level];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reported, setReported] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const question = questions[index];

  const choose = (option: number) => {
    if (selected !== null) return;
    setSelected(option);
    const isCorrect = option === question.correct;
    if (isCorrect) setScore((value) => value + 1);

    timer.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((value) => value + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 1250);
  };

  if (finished) {
    const ratio = score / questions.length;
    return (
      <Card style={styles.resultCard}>
        <Txt size={34}>{ratio === 1 ? "🏆" : ratio >= 0.66 ? "🎉" : "💪"}</Txt>
        <Txt size={18} weight="extraBold" style={{ marginTop: 6 }}>
          {score}/{questions.length} correctas
        </Txt>
        <Txt size={12.5} color={colors.textSecondary} style={{ marginTop: 4 }}>
          {ratio === 1 ? "¡Perfecto!" : ratio >= 0.66 ? "¡Muy bien!" : "¡Sigue practicando!"}
        </Txt>
        <PrimaryButton
          label={reported ? "Resultado enviado ✓" : "Ver resultados"}
          icon={null}
          disabled={reported}
          onPress={() => {
            setReported(true);
            onFinish(score, questions.length);
          }}
          style={{ marginTop: 14, alignSelf: "stretch" }}
        />
      </Card>
    );
  }

  return (
    <Card style={styles.card} padded={false}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Txt size={10.5} weight="bold" color={colors.primary}>
              ⚡ Pregunta {index + 1}/{questions.length}
            </Txt>
          </View>
          <View style={styles.progressDots}>
            {questions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < index ? colors.accent : i === index ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Txt size={13} weight="semiBold" style={{ lineHeight: 19, marginBottom: 12 }}>
          {question.q}
        </Txt>

        <View style={{ gap: 8 }}>
          {question.opts.map((option, i) => {
            const isCorrect = i === question.correct;
            const isSelected = selected === i;
            const revealed = selected !== null;

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
            const textColor = revealed
              ? isCorrect
                ? "#065F46"
                : isSelected
                  ? colors.dangerText
                  : colors.text
              : colors.text;

            return (
              <Pressable
                key={i}
                onPress={() => choose(i)}
                disabled={revealed}
                accessibilityRole="button"
                style={[styles.option, { backgroundColor: background, borderColor }]}
              >
                <View style={[styles.optionBullet, { borderColor }]}>
                  <Txt size={10} weight="bold" color={textColor}>
                    {revealed && isCorrect
                      ? "✓"
                      : revealed && isSelected
                        ? "✗"
                        : String.fromCharCode(65 + i)}
                  </Txt>
                </View>
                <Txt size={12.5} weight="semiBold" color={textColor} style={{ flex: 1 }}>
                  {option}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        {selected !== null ? (
          <View style={styles.explanation}>
            <Ionicons name="book-outline" size={14} color={colors.warningText} />
            <Txt size={11.5} color={colors.warningText} style={{ flex: 1, lineHeight: 16 }}>
              {question.explanation}
            </Txt>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "rgba(91,33,250,0.15)",
    borderWidth: 1.5,
  },
  body: {
    padding: 15,
  },
  resultCard: {
    alignItems: "center",
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    backgroundColor: colors.primarySurface,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  progressDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
  optionBullet: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  explanation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 11,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
});
