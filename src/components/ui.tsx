import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, cardShadow, radius } from "../theme";
import { Txt } from "./Txt";

/* ─── Card ─── */

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, padded ? styles.cardPadding : null, style]}>
      {children}
    </View>
  );
}

/* ─── Pill / etiqueta ─── */

export function Pill({
  label,
  color = colors.primary,
  background = colors.primarySurface,
  size = 11,
  icon,
}: {
  label: string;
  color?: string;
  background?: string;
  size?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon ? <Ionicons name={icon} size={size + 1} color={color} /> : null}
      <Txt size={size} weight="bold" color={color}>
        {label}
      </Txt>
    </View>
  );
}

/* ─── Botón principal ─── */

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon = "arrow-forward",
  style,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap | null;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.primaryWrapper,
        disabled ? styles.primaryDisabled : null,
        pressed && !disabled ? { opacity: 0.88, transform: [{ scale: 0.99 }] } : null,
        style,
      ]}
    >
      {disabled ? (
        <View style={[styles.primaryInner, { backgroundColor: colors.border }]}>
          <Txt size={15} weight="bold" color={colors.textMuted}>
            {label}
          </Txt>
        </View>
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryInner}
        >
          <Txt size={15} weight="bold" color={colors.white}>
            {label}
          </Txt>
          {icon && !loading ? <Ionicons name={icon} size={17} color={colors.white} /> : null}
        </LinearGradient>
      )}
    </Pressable>
  );
}

/* ─── Botón secundario ─── */

export function SecondaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.secondary, pressed ? { opacity: 0.7 } : null]}
    >
      {icon ? <Ionicons name={icon} size={16} color={colors.primary} /> : null}
      <Txt size={13} weight="semiBold" color={colors.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ─── Chip para respuestas rápidas ─── */

export function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.chip, pressed ? { backgroundColor: colors.primaryBorder } : null]}
    >
      <Txt size={11.5} weight="semiBold" color={colors.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ─── Título de sección con acción opcional ─── */

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Txt size={14.5} weight="bold">
        {title}
      </Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Txt size={11.5} weight="semiBold" color={colors.primary}>
            {action}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    ...cardShadow,
  },
  cardPadding: {
    padding: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  primaryWrapper: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  primaryDisabled: {
    borderRadius: radius.md,
  },
  primaryInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignSelf: "flex-start",
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
});
