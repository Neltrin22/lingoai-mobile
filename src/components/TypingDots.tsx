import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../theme";

/** Tres puntos animados mientras el tutor (o el reconocimiento de voz) responde. */
export function TypingDots({ color = colors.primary }: { color?: string }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const dots = [dot1, dot2, dot3];
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(280 - index * 90),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.row}>
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View key={index} style={[styles.dot, { backgroundColor: color, opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
