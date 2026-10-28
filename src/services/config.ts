import Constants from "expo-constants";

/**
 * URL del backend proxy.
 *
 * Prioridad:
 * 1. EXPO_PUBLIC_API_URL (definida en .env o al arrancar el bundler).
 * 2. El mismo host que sirve Metro (así funciona en un celular físico sin
 *    configurar nada, siempre que el backend corra en el PC del desarrollador).
 * 3. localhost (emulador Android con `adb reverse`).
 */
function guessDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;

  const host = hostUri?.split(":")[0];
  return host && host.length > 0 ? host : null;
}

const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const DEFAULT_API_URL =
  envUrl && envUrl.length > 0
    ? envUrl.replace(/\/+$/, "")
    : `http://${guessDevHost() ?? "localhost"}:3001`;

export const REQUEST_TIMEOUT_MS = 20_000;

export const APP_VERSION = "1.0.0";
