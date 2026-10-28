import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import type { Flashcard } from "../types";
import { colors, radius } from "../theme";
import { Txt } from "./Txt";

export function FlipCard({ card }: { card: Flashcard }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const toggle = () => {
    const next = flipped ? 0 : 1;
    setFlipped(!flipped);
    Animated.spring(anim, {
      toValue: next,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={`Flashcard ${card.word}. Toca para ver la definición.`}
      style={styles.wrapper}
    >
      <Animated.View
        style={[
          styles.face,
          {
            borderColor: card.fromError ? colors.warningBorder : "#D1FAE5",
            transform: [{ perspective: 800 }, { rotateY: frontRotate }],
          },
        ]}
      >
        {card.fromError ? (
          <View style={styles.errorTag}>
            <Txt size={8.5} weight="bold" color={colors.warningText}>
              ⚠ Error previo
            </Txt>
          </View>
        ) : null}
        <Txt size={19} weight="extraBold" style={styles.word} numberOfLines={2}>
          {card.word}
        </Txt>
        <View style={styles.footer}>
          <Txt size={9.5} color={colors.textMuted}>
            Toca para ver
          </Txt>
          <Ionicons name="sync-outline" size={15} color={colors.textMuted} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          styles.back,
          {
            borderColor: card.fromError ? colors.warningBorder : "#D1FAE5",
            transform: [{ perspective: 800 }, { rotateY: backRotate }],
          },
        ]}
      >
        <Txt size={11.5} weight="semiBold" color={colors.primary} style={{ lineHeight: 17 }}>
          {card.definition}
        </Txt>
        <View style={styles.example}>
          <Txt size={10.5} color={colors.textSecondary} style={{ fontStyle: "italic" }} numberOfLines={3}>
            "{card.example}"
          </Txt>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 132,
    flex: 1,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: 14,
    backfaceVisibility: "hidden",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  back: {
    position: "absolute",
  },
  word: {
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorTag: {
    position: "absolute",
    top: 9,
    right: 9,
    backgroundColor: colors.goldSoft,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  example: {
    backgroundColor: colors.background,
    borderRadius: 9,
    padding: 8,
    marginTop: 8,
  },
});
