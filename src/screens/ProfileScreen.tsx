import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LevelPicker } from "../components/LevelBadge";
import { Txt } from "../components/Txt";
import { Card, PrimaryButton, SecondaryButton } from "../components/ui";
import { LEVELS, TAB_LABELS } from "../data/content";
import { pingServer } from "../services/api";
import { APP_VERSION, DEFAULT_API_URL } from "../services/config";
import { useApp } from "../state/store";
import { colors, fonts, radius } from "../theme";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const level = state.level ?? "beginner";
  const [apiDraft, setApiDraft] = useState(state.apiUrl);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; detail: string } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);
    actions.setApiUrl(apiDraft.trim());
    const result = await pingServer(apiDraft.trim());
    setStatus(result);
    setTesting(false);
  };

  const confirmReset = () => {
    Alert.alert(
      "Borrar todo el progreso",
      "Se eliminarán tu nivel, racha, chat y flashcards. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar todo", style: "destructive", onPress: () => actions.resetAll() },
      ],
    );
  };

  const config = LEVELS[level];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Txt size={21} weight="extraBold">Perfil</Txt>
        <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 3 }}>
          Ajustes de tu cuenta y del tutor
        </Txt>
      </View>

      <View style={{ padding: 18 }}>
        {/* Identidad */}
        <Card style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: config.bg }]}>
            <Txt size={26}>{config.emoji}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              value={state.name}
              onChangeText={actions.setName}
              style={styles.nameInput}
              maxLength={28}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textMuted}
            />
            <Txt size={11} color={colors.textSecondary} style={{ marginTop: 2 }}>
              {config.label} · {config.cefr} · {config.topicEs}
            </Txt>
          </View>
        </Card>

        {/* Nivel */}
        <View style={{ marginTop: 20 }}>
          <Txt size={12} weight="bold" color={colors.textSecondary} style={styles.sectionLabel}>
            TU NIVEL
          </Txt>
          <LevelPicker
            value={level}
            onChange={(next) => {
              if (next === level) return;
              Alert.alert(
                "Cambiar de nivel",
                `Los indicadores de habilidad se reiniciarán a la base de ${LEVELS[next].label}. Tu historial se conserva.`,
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Cambiar", onPress: () => actions.setLevel(next) },
                ],
              );
            }}
          />
        </View>

        {/* Tutor IA */}
        <View style={{ marginTop: 20 }}>
          <Txt size={12} weight="bold" color={colors.textSecondary} style={styles.sectionLabel}>
            TUTOR IA
          </Txt>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Txt size={13} weight="semiBold">Leer respuestas en voz alta</Txt>
                <Txt size={10.5} color={colors.textSecondary} style={{ marginTop: 2 }}>
                  Usa el TTS del dispositivo (inglés de EE. UU.).
                </Txt>
              </View>
              <Switch
                value={state.soundOn}
                onValueChange={actions.setSoundOn}
                trackColor={{ false: colors.border, true: colors.primaryBorder }}
                thumbColor={state.soundOn ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View style={styles.divider} />

            <Txt size={13} weight="semiBold">Servidor del tutor</Txt>
            <Txt size={10.5} color={colors.textSecondary} style={{ marginTop: 2, marginBottom: 8 }}>
              URL del backend proxy que guarda la API key. En un celular físico debe ser la IP
              de tu PC en la misma red Wi-Fi.
            </Txt>
            <TextInput
              value={apiDraft}
              onChangeText={setApiDraft}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="http://192.168.0.10:3001"
              placeholderTextColor={colors.textMuted}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" }}>
              <PrimaryButton
                label={testing ? "Probando…" : "Guardar y probar"}
                icon={null}
                onPress={testConnection}
                disabled={testing || apiDraft.trim().length === 0}
                style={{ flex: 1 }}
              />
              <SecondaryButton
                label="Restaurar"
                icon="refresh"
                onPress={() => {
                  setApiDraft(DEFAULT_API_URL);
                  setStatus(null);
                }}
              />
            </View>

            {testing ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Txt size={10.5} color={colors.textSecondary}>Contactando el servidor…</Txt>
              </View>
            ) : null}

            {status ? (
              <View
                style={[
                  styles.statusRow,
                  {
                    backgroundColor: status.ok ? colors.accentSurface : colors.dangerSurface,
                  },
                ]}
              >
                <Ionicons
                  name={status.ok ? "checkmark-circle" : "alert-circle"}
                  size={14}
                  color={status.ok ? colors.accentDark : colors.danger}
                />
                <Txt
                  size={10.5}
                  weight="semiBold"
                  color={status.ok ? colors.accentDark : colors.danger}
                  style={{ flex: 1 }}
                >
                  {status.detail}
                </Txt>
              </View>
            ) : null}
          </Card>
        </View>

        {/* Datos */}
        <View style={{ marginTop: 20 }}>
          <Txt size={12} weight="bold" color={colors.textSecondary} style={styles.sectionLabel}>
            TUS DATOS
          </Txt>
          <Card>
            <View style={styles.dataRow}>
              <Txt size={11.5} color={colors.textSecondary}>Palabras guardadas</Txt>
              <Txt size={11.5} weight="bold">{state.flashcards.length}</Txt>
            </View>
            <View style={styles.dataRow}>
              <Txt size={11.5} color={colors.textSecondary}>Mensajes enviados</Txt>
              <Txt size={11.5} weight="bold">{state.progress.totalMessages}</Txt>
            </View>
            <View style={styles.dataRow}>
              <Txt size={11.5} color={colors.textSecondary}>Racha actual</Txt>
              <Txt size={11.5} weight="bold">{state.progress.streak} días</Txt>
            </View>
            <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
              <Txt size={11.5} color={colors.textSecondary}>Almacenamiento</Txt>
              <Txt size={11.5} weight="bold">Local (AsyncStorage)</Txt>
            </View>

            <Pressable onPress={confirmReset} style={styles.dangerButton}>
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Txt size={12} weight="semiBold" color={colors.danger}>
                Borrar progreso y empezar de nuevo
              </Txt>
            </Pressable>
          </Card>
        </View>

        <View style={{ marginTop: 22, alignItems: "center", gap: 4 }}>
          <Txt size={12} weight="bold" color={colors.primary}>LingoAI · v{APP_VERSION}</Txt>
          <Txt size={10} color={colors.textMuted} center>
            Computación Móvil · Universidad de Antioquia
          </Txt>
          <Txt size={10} color={colors.textMuted} center>
            Nelson Alcides Puerta García · Jhon Deivy Rodas Morales
          </Txt>
          <Txt size={9.5} color={colors.textMuted} center style={{ marginTop: 4 }}>
            {TAB_LABELS.profile} · React Native + Expo · Tutor con IA
          </Txt>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
    padding: 0,
  },
  sectionLabel: {
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    borderRadius: radius.sm,
    padding: 9,
    backgroundColor: colors.background,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSurface,
  },
});
