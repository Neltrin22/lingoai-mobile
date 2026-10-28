import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useState } from "react";

export type RecorderController = {
  isRecording: boolean;
  durationMillis: number;
  busy: boolean;
  error: string | null;
  start: () => Promise<boolean>;
  stop: () => Promise<string | null>;
};

/**
 * Grabación de voz con expo-audio.
 * El audio se envía al backend para transcribirlo (Whisper), así funciona en
 * Expo Go sin módulos nativos extra.
 */
export function useRecorder(): RecorderController {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    setBusy(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("Necesito permiso para usar el micrófono. Actívalo en los ajustes del sistema.");
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      return true;
    } catch (err) {
      console.warn("[LingoAI] Error al grabar", err);
      setError("No pude iniciar la grabación. Intenta de nuevo.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    setBusy(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      return recorder.uri ?? null;
    } catch (err) {
      console.warn("[LingoAI] Error al detener la grabación", err);
      setError("No pude guardar el audio.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [recorder]);

  return {
    isRecording: recorderState.isRecording,
    durationMillis: recorderState.durationMillis,
    busy,
    error,
    start,
    stop,
  };
}
