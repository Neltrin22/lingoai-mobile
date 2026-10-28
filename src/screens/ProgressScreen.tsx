import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlipCard } from "../components/FlipCard";
import { LevelBadge } from "../components/LevelBadge";
import { CircularProgress, ProgressBar } from "../components/Progress";
import { Txt } from "../components/Txt";
import { Card, SectionTitle } from "../components/ui";
import { WeeklyChart } from "../components/WeeklyChart";
import { LEVELS } from "../data/content";
import { useApp } from "../state/store";
import { colors } from "../theme";
import { dateKey, humanDate, lastSevenDays, parseDateKey } from "../utils/dates";
import type { SkillKey } from "../types";

const SKILL_META: Record<SkillKey, { label: string; color: string }> = {
  vocabulary: { label: "Vocabulario", color: "#5B21FA" },
  grammar: { label: "Gramática", color: "#10C98F" },
  pronunciation: { label: "Pronunciación", color: "#F59E0B" },
  comprehension: { label: "Comprensión", color: "#EC4899" },
};

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const [showAll, setShowAll] = useState(false);
  const level = state.level ?? "beginner";
  const progress = state.progress;

  const data = useMemo(() => {
    const values = Object.values(progress.skills);
    const overall = Math.round(values.reduce((total, value) => total + value, 0) / values.length);
    const days = lastSevenDays();
    const weekly = days.reduce(
      (total, day) => total + (progress.logs.find((log) => log.date === day.key)?.minutes ?? 0),
      0,
    );
    const todayMinutes = Math.round(
      progress.logs.find((log) => log.date === dateKey())?.minutes ?? 0,
    );
    const weekLabel = `${humanDate(parseDateKey(days[0].key))} – ${humanDate(parseDateKey(days[6].key))}`;
    return { overall, weekly: Math.round(weekly), todayMinutes, weekLabel };
  }, [progress.skills, progress.logs]);

  const cards = showAll ? state.flashcards : state.flashcards.slice(0, 4);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 26 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Txt size={21} weight="extraBold">Tu Progreso</Txt>
        <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 3 }}>
          Semana del {data.weekLabel}
        </Txt>
      </View>

      <View style={{ padding: 18 }}>
        {/* Resumen */}
        <Card style={styles.summary}>
          <CircularProgress value={data.overall} size={92} stroke={9} color={colors.primary}>
            <View style={{ alignItems: "center" }}>
              <Txt size={21} weight="extraBold" color={colors.primary}>{data.overall}%</Txt>
              <Txt size={8.5} color={colors.textMuted}>avance</Txt>
            </View>
          </CircularProgress>

          <View style={{ flex: 1 }}>
            <Txt size={15} weight="bold">¡Buen progreso, {state.name}!</Txt>
            <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 4, lineHeight: 17 }}>
              {data.weekly} minutos esta semana · {data.todayMinutes} min hoy.
            </Txt>
            <View style={styles.chips}>
              <LevelBadge level={level} showCefr={false} />
              <View style={styles.streakChip}>
                <Ionicons name="flame" size={11} color={colors.warning} />
                <Txt size={10} weight="bold" color={colors.warningText}>
                  {progress.streak} {progress.streak === 1 ? "día" : "días"}
                </Txt>
              </View>
            </View>
          </View>
        </Card>

        {/* Habilidades */}
        <Card style={{ marginBottom: 14 }}>
          <Txt size={14} weight="bold" style={{ marginBottom: 16 }}>Desglose de habilidades</Txt>
          <View style={{ gap: 14 }}>
            {(Object.keys(SKILL_META) as SkillKey[]).map((key) => {
              const meta = SKILL_META[key];
              const value = Math.round(progress.skills[key]);
              return (
                <View key={key}>
                  <View style={styles.skillRow}>
                    <Txt size={12} weight="semiBold">{meta.label}</Txt>
                    <Txt size={12} weight="bold" color={meta.color}>{value}%</Txt>
                  </View>
                  <ProgressBar value={value} color={meta.color} />
                </View>
              );
            })}
          </View>
          <Txt size={10} color={colors.textMuted} style={{ marginTop: 12, lineHeight: 15 }}>
            Las habilidades se actualizan con cada corrección, quiz y análisis de voz.
          </Txt>
        </Card>

        {/* Estadísticas */}
        <View style={styles.statsGrid}>
          {[
            { icon: "book-outline", label: "Palabras", value: progress.totalWords, color: colors.primary },
            { icon: "chatbubbles-outline", label: "Mensajes", value: progress.totalMessages, color: colors.accentDark },
            { icon: "pencil-outline", label: "Correcciones", value: progress.corrections, color: colors.warning },
            { icon: "school-outline", label: "Quizzes", value: progress.exercisesDone, color: colors.pink },
          ].map((item) => (
            <Card key={item.label} style={styles.statCard}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={17} color={item.color} />
              <Txt size={20} weight="extraBold" style={{ marginTop: 4 }}>{item.value}</Txt>
              <Txt size={10} color={colors.textSecondary}>{item.label}</Txt>
            </Card>
          ))}
        </View>

        {/* Pronunciación */}
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Txt size={13} weight="bold">Pronunciación</Txt>
              <Txt size={11} color={colors.textSecondary} style={{ marginTop: 3 }}>
                {progress.pronunciationTries > 0
                  ? `${progress.pronunciationTries} grabaciones · mejor puntaje ${progress.bestPronunciation}%`
                  : "Aún no has grabado tu voz. Prueba el modo Pronunciación."}
              </Txt>
            </View>
            <CircularProgress value={progress.bestPronunciation} size={54} stroke={6} color={colors.pink}>
              <Txt size={11} weight="extraBold" color={colors.pink}>
                {progress.bestPronunciation}%
              </Txt>
            </CircularProgress>
          </View>
        </Card>

        {/* Actividad semanal */}
        <Card style={{ marginTop: 14 }}>
          <Txt size={14} weight="bold">Actividad semanal</Txt>
          <WeeklyChart logs={progress.logs} goal={30} />
        </Card>

        {/* Flashcards */}
        <View style={{ marginTop: 18 }}>
          <SectionTitle
            title="Repaso de flashcards"
            action={state.flashcards.length > 4 ? (showAll ? "Ver menos" : `Ver todas (${state.flashcards.length})`) : undefined}
            onAction={() => setShowAll((value) => !value)}
          />
          <Txt size={10.5} color={colors.textMuted} style={{ marginBottom: 10 }}>
            Generadas de tus errores en el chat. Toca para ver la definición.
          </Txt>

          {cards.length === 0 ? (
            <Card>
              <Txt size={11.5} color={colors.textSecondary} center>
                Conversa con el tutor para empezar a generar tarjetas.
              </Txt>
            </Card>
          ) : (
            <View style={styles.grid}>
              {cards.map((card) => (
                <View key={card.id} style={styles.gridItem}>
                  <FlipCard card={card} />
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable onPress={() => setShowAll((value) => !value)} style={{ alignSelf: "center", marginTop: 16 }}>
          <Txt size={10.5} color={colors.textMuted}>
            {state.flashcards.length} tarjetas en tu biblioteca
          </Txt>
        </Pressable>
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
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 14,
    paddingVertical: 20,
  },
  chips: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.goldSoft,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47.5%",
    flexGrow: 1,
    padding: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "47.5%",
    flexGrow: 1,
    height: 136,
  },
});
