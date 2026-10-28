import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LEVELS } from "../data/content";
import { colors, radius } from "../theme";
import type { Level } from "../types";
import { Txt } from "./Txt";

export function LevelBadge({ level, showCefr = true }: { level: Level; showCefr?: boolean }) {
  const config = LEVELS[level];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Txt size={10}>
        {config.emoji}
      </Txt>
      <Txt size={10.5} weight="bold" color={config.color}>
        {config.label}
        {showCefr ? ` · ${config.cefr}` : ""}
      </Txt>
    </View>
  );
}

export function LevelPicker({
  value,
  onChange,
}: {
  value: Level;
  onChange: (level: Level) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {(Object.keys(LEVELS) as Level[]).map((key) => {
        const config = LEVELS[key];
        const selected = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.option,
              {
                borderColor: selected ? config.color : colors.border,
                backgroundColor: selected ? config.bg : colors.background,
              },
            ]}
          >
            <View
              style={[
                styles.emojiBox,
                { backgroundColor: selected ? config.color : colors.border },
              ]}
            >
              <Txt size={20}>{config.emoji}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="bold">
                {config.label}
              </Txt>
              <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 1 }}>
                {config.cefr} · {config.topicEs}
              </Txt>
            </View>
            <View
              style={[
                styles.check,
                {
                  backgroundColor: selected ? config.color : colors.border,
                  borderColor: selected ? config.color : colors.border,
                },
              ]}
            >
              {selected ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
