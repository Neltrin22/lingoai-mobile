import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useInsets } from "../hooks/useInsets";
import { LevelBadge } from "../components/LevelBadge";
import { CircularProgress } from "../components/Progress";
import { Txt } from "../components/Txt";
import { Card, PrimaryButton } from "../components/ui";
import { WeeklyChart } from "../components/WeeklyChart";
import { LEVELS } from "../data/content";
import { useApp } from "../state/store";
import { colors, radius, heroShadow } from "../theme";
import { dateKey, lastSevenDays } from "../utils/dates";

const DAILY_GOAL = 30;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardScreen({
  onOpenChat,
  onOpenProgress,
}: {
  onOpenChat: () => void;
  onOpenProgress: () => void;
}) {
  const insets = useInsets();
  const { state } = useApp();
  const level = state.level ?? "beginner";
  const config = LEVELS[level];
  const progress = state.progress;

  const stats = useMemo(() => {
    const today = progress.logs.find((log) => log.date === dateKey());
    const days = lastSevenDays();
    const weekly = days.reduce(
      (total, day) => total + (progress.logs.find((log) => log.date === day.key)?.minutes ?? 0),
      0,
    );
    const lastNine = days.map((day) => progress.logs.find((log) => log.date === day.key)?.words ?? 0);
    return {
      todayMinutes: Math.round(today?.minutes ?? 0),
      todayWords: today?.words ?? 0,
      weekly: Math.round(weekly),
      lastNine,
      goalPct: Math.min(100, Math.round(((today?.minutes ?? 0) / DAILY_GOAL) * 100)),
    };
  }, [progress.logs]);

  const maxWords = Math.max(4, ...stats.lastNine);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.blobLarge} />
        <View style={styles.blobSmall} />

        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Txt size={12.5} color="rgba(255,255,255,0.78)">
              {greeting()}
            </Txt>
            <Txt size={23} weight="extraBold" color={colors.white} style={{ marginTop: 3 }}>
              ¡Hola, {state.name}! 👋
            </Txt>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <LevelBadge level={level} />
            </View>
          </View>

          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <View style={styles.avatar}>
              <Txt size={19}>{state.name.charAt(0).toUpperCase()}</Txt>
            </View>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Txt size={9.5} weight="semiBold" color={colors.white}>
                Tutor IA en línea
              </Txt>
            </View>
          </View>
        </View>

        <View style={styles.streakRow}>
          <Ionicons name="flame" size={18} color="#FCD34D" />
          <Txt size={12.5} weight="bold" color={colors.white}>
            {progress.streak > 0
              ? `¡${progress.streak} ${progress.streak === 1 ? "día" : "días"} de racha!`
              : "Empieza tu racha hoy"}
          </Txt>
        </View>
      </LinearGradient>

      <View style={{ padding: 18 }}>
        {/* Lección recomendada */}
        <Card style={{ marginBottom: 14, ...heroShadow, shadowOpacity: 0.1 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <View style={styles.recommendedTag}>
                  <Txt size={8.5} weight="bold" color={colors.primary}>
                    RECOMENDADA
                  </Txt>
                </View>
                <Ionicons name="star" size={10} color={colors.warning} />
                <Ionicons name="star" size={10} color={colors.warning} />
                <Ionicons name="star" size={10} color={colors.warning} />
              </View>
              <Txt size={15.5} weight="bold">
                {config.topic}
              </Txt>
              <Txt size={11.5} color={colors.textSecondary} style={{ marginTop: 4 }}>
                {config.topicEs} · 12 min · {config.cefr}
              </Txt>
            </View>
            <View style={styles.chatIcon}>
              <Ionicons name="chatbubble-ellipses" size={21} color={colors.white} />
            </View>
          </View>
          <PrimaryButton
            label="Ir al tutor IA"
            onPress={onOpenChat}
            style={{ marginTop: 14 }}
          />
        </Card>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Txt size={11.5} color={colors.textSecondary}>Racha</Txt>
              <Ionicons name="flame" size={17} color={colors.warning} />
            </View>
            <Txt size={27} weight="extraBold" color={colors.warning} style={{ lineHeight: 30 }}>
              {progress.streak}
            </Txt>
            <Txt size={10.5} color={colors.textSecondary} style={{ marginTop: 2 }}>
              {progress.streak === 1 ? "día consecutivo" : "días consecutivos"}
            </Txt>
          </Card>

          <Card style={styles.metricCard}>
            <Txt size={11.5} color={colors.textSecondary}>Meta diaria</Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <CircularProgress value={stats.goalPct} size={48} stroke={6} color={colors.accent}>
                <Txt size={9.5} weight="extraBold" color={colors.accentDark}>
                  {stats.goalPct}%
                </Txt>
              </CircularProgress>
              <View>
                <Txt size={13.5} weight="extraBold">
                  {stats.todayMinutes}
                  <Txt size={10} color={colors.textMuted}>/{DAILY_GOAL}</Txt>
                </Txt>
                <Txt size={9.5} color={colors.textSecondary}>minutos</Txt>
              </View>
            </View>
          </Card>
        </View>

        <Card style={styles.wordsCard}>
          <View>
            <Txt size={11.5} color={colors.textSecondary}>Palabras nuevas hoy</Txt>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 2 }}>
              <Txt size={26} weight="extraBold" color={colors.primary}>
                {stats.todayWords}
              </Txt>
              <Txt size={12} color={colors.textSecondary}>palabras</Txt>
            </View>
            <Txt size={10} color={colors.textMuted} style={{ marginTop: 2 }}>
              {progress.totalWords} en total
            </Txt>
          </View>
          <View style={styles.miniBars}>
            {stats.lastNine.map((value, index) => (
              <View
                key={index}
                style={{
                  width: 7,
                  height: 12 + (value / maxWords) * 26,
                  borderRadius: 4,
                  backgroundColor: value > 0 ? colors.primary : colors.border,
                  opacity: index === stats.lastNine.length - 1 ? 1 : 0.55 + index * 0.05,
                }}
              />
            ))}
          </View>
        </Card>

        {/* Progreso semanal */}
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Txt size={14} weight="bold">Progreso semanal</Txt>
            <Pressable onPress={onOpenProgress} hitSlop={8}>
              <Txt size={11} weight="semiBold" color={colors.primary}>
                Ver detalle
              </Txt>
            </Pressable>
          </View>
          <WeeklyChart logs={progress.logs} goal={DAILY_GOAL} />
          <Txt size={10.5} color={colors.textMuted} style={{ marginTop: 8 }}>
            {stats.weekly} minutos esta semana · objetivo {DAILY_GOAL * 7} min
          </Txt>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  blobLarge: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  blobSmall: {
    position: "absolute",
    right: 60,
    top: 70,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6EE7B7",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: "flex-start",
  },
  recommendedTag: {
    backgroundColor: colors.primarySurface,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chatIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  wordsCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
  },
  miniBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
});
