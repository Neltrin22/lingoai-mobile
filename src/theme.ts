import type { TextStyle, ViewStyle } from "react-native";

/**
 * Design tokens portados desde el prototipo de Figma.
 * Mantener aquí cualquier color/tipografía evita valores sueltos en las pantallas.
 */
export const colors = {
  primary: "#5B21FA",
  primaryLight: "#7C3AFF",
  primarySurface: "#EEE9FF",
  primaryBorder: "#C4B5FD",

  accent: "#10C98F",
  accentSurface: "#DCFBF0",
  accentDark: "#059669",

  warning: "#F59E0B",
  warningSurface: "#FFFBEB",
  warningBorder: "#FDE68A",
  warningText: "#92400E",

  danger: "#EF4444",
  dangerSurface: "#FEF2F2",
  dangerText: "#991B1B",

  pink: "#EC4899",
  pinkSurface: "#FCE7F3",

  background: "#F8F9FA",
  surface: "#FFFFFF",

  text: "#1A1A1A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",

  border: "#E5E7EB",
  divider: "#F0F0F0",

  gold: "#FCD34D",
  goldSoft: "#FEF3C7",

  overlay: "rgba(15, 15, 19, 0.45)",
  white: "#FFFFFF",
};

export const fonts = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semiBold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extraBold: "Outfit_800ExtraBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

/** Sombra suave usada por las tarjetas (iOS + Android). */
export const cardShadow: ViewStyle = {
  shadowColor: "#000000",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

export const heroShadow: ViewStyle = {
  shadowColor: colors.primary,
  shadowOpacity: 0.28,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export const textBase: TextStyle = {
  fontFamily: fonts.regular,
  color: colors.text,
};
