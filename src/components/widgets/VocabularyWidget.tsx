import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { VOCAB_SETS, type VocabWord } from "../../data/content";
import { speakEnglish } from "../../services/speech";
import { colors, radius } from "../../theme";
import type { Level } from "../../types";
import { Txt } from "../Txt";
import { Card, PrimaryButton } from "../ui";

export function VocabularyWidget({
  level,
  onLearned,
}: {
  level: Level;
  onLearned: (word: VocabWord) => void;
}) {
  const words = VOCAB_SETS[level];
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const learned = useRef<Set<string>>(new Set());

  const word = words[index];

  const reveal = () => {
    setRevealed(true);
    if (!learned.current.has(word.word)) {
      learned.current.add(word.word);
      onLearned(word);
    }
  };

  return (
    <Card style={styles.card} padded={false}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Txt size={10.5} weight="bold" color={colors.accentDark}>
              📖 Vocabulario · {index + 1}/{words.length}
            </Txt>
          </View>
          <View style={styles.dots}>
            {words.map((entry, i) => (
              <Pressable
                key={entry.word}
                hitSlop={6}
                onPress={() => {
                  setIndex(i);
                  setRevealed(false);
                }}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: i <= index ? colors.accent : colors.border },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.center}>
          <View style={styles.wordRow}>
            <Txt size={25} weight="extraBold">
              {word.word}
            </Txt>
            <Pressable
              onPress={() => speakEnglish(word.word)}
              hitSlop={10}
              accessibilityLabel={`Escuchar ${word.word}`}
            >
              <Ionicons name="volume-high-outline" size={20} color={colors.accentDark} />
            </Pressable>
          </View>

          {!revealed ? (
            <PrimaryButton
              label="Ver traducción"
              icon={null}
              onPress={reveal}
              style={{ marginTop: 12, alignSelf: "stretch" }}
            />
          ) : (
            <>
              <Txt size={14.5} weight="semiBold" color={colors.primary} style={{ marginTop: 8 }}>
                {word.translation}
              </Txt>
              <View style={styles.example}>
                <Txt size={11.5} color={colors.textSecondary} style={{ fontStyle: "italic" }}>
                  "{word.example}"
                </Txt>
              </View>
              {index + 1 < words.length ? (
                <PrimaryButton
                  label="Siguiente palabra"
                  icon="arrow-forward"
                  onPress={() => {
                    setIndex((value) => value + 1);
                    setRevealed(false);
                  }}
                  style={{ marginTop: 12, alignSelf: "stretch" }}
                />
              ) : (
                <Txt size={11.5} color={colors.textMuted} center style={{ marginTop: 12 }}>
                  ¡Terminaste este set! Pide más vocabulario en el chat.
                </Txt>
              )}
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "rgba(16,201,143,0.25)",
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
    backgroundColor: colors.accentSurface,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  center: {
    alignItems: "center",
    paddingTop: 10,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  example: {
    marginTop: 7,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
});
