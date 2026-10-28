import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * Suma a la racha/tiempo de estudio los minutos que el usuario pasa en una
 * pantalla activa. Se reporta en bloques de 30 s para no escribir en disco
 * constantemente.
 */
export function useStudyTimer(enabled: boolean, onMinutes: (minutes: number) => void): void {
  const callback = useRef(onMinutes);
  callback.current = onMinutes;

  useEffect(() => {
    if (!enabled) return;

    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      const minutes = (now - last) / 60_000;
      last = now;
      if (minutes >= 0.4) callback.current(minutes);
    };

    const interval = setInterval(flush, 30_000);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") last = Date.now();
      else flush();
    });

    return () => {
      flush();
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled]);
}
