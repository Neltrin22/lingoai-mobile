import { Platform, StatusBar } from "react-native";

export type Insets = { top: number; bottom: number };

/**
 * Insets del sistema sin depender de `react-native-safe-area-context`.
 *
 * En Android la barra de estado expone su altura con `StatusBar.currentHeight`
 * (el modo edge-to-edge es obligatorio desde Android 16). En iOS usamos los
 * valores estándar de notch y barra de gestos.
 */
export function useInsets(): Insets {
  if (Platform.OS === "android") {
    return {
      top: StatusBar.currentHeight ?? 24,
      bottom: 12,
    };
  }

  if (Platform.OS === "ios") {
    return { top: 54, bottom: 28 };
  }

  return { top: 0, bottom: 0 };
}
