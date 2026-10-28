import React from "react";
import { StyleSheet, View } from "react-native";
import { lastSevenDays } from "../utils/dates";
import type { DayLog } from "../types";
import { colors } from "../theme";
import { Txt } from "./Txt";

/**
 * Gráfico de barras de los últimos 7 días. Se calcula con los minutos reales
 * registrados por `useStudyTimer`, no con datos de ejemplo.
 */
export function WeeklyChart({
  logs,
  height = 82,
  goal,
}: {
  logs: DayLog[];
  height?: number;
  goal?: number;
}) {
  const days = lastSevenDays();
  const values = days.map((day) => logs.find((log) => log.date === day.key)?.minutes ?? 0);
  const max = Math.max(goal ?? 30, ...values, 1);

  return (
    <View>
      <View style={[styles.bars, { height: height + 24 }]}>
        {days.map((day, index) => {
          const value = values[index];
          const barHeight = value > 0 ? Math.max(6, (value / max) * height) : 5;
          return (
            <View key={day.key} style={styles.column}>
              <View style={styles.barArea}>
                {day.isToday && value > 0 ? (
                  <View style={styles.todayTag}>
                    <Txt size={8.5} weight="bold" color={colors.primary}>
                      {Math.round(value)}m
                    </Txt>
                  </View>
                ) : null}
                <View
                  style={{
                    width: "100%",
                    height: barHeight,
                    borderRadius: 7,
                    backgroundColor:
                      value === 0
                        ? colors.divider
                        : day.isToday
                          ? colors.primary
                          : colors.primaryBorder,
                  }}
                />
              </View>
              <Txt
                size={10.5}
                weight={day.isToday ? "bold" : "regular"}
                color={day.isToday ? colors.primary : colors.textMuted}
              >
                {day.day}
              </Txt>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    marginTop: 14,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barArea: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  todayTag: {
    position: "absolute",
    top: -2,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    zIndex: 2,
  },
});
