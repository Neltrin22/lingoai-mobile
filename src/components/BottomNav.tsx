import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Tab } from "../types";
import { colors, radius } from "../theme";
import { useInsets } from "../hooks/useInsets";
import { Txt } from "./Txt";

const TABS: {
  id: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "dashboard", label: "Inicio", icon: "home-outline", activeIcon: "home" },
  { id: "chat", label: "Tutor", icon: "chatbubble-ellipses-outline", activeIcon: "chatbubble-ellipses" },
  { id: "progress", label: "Progreso", icon: "stats-chart-outline", activeIcon: "stats-chart" },
  { id: "profile", label: "Perfil", icon: "person-outline", activeIcon: "person" },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const insets = useInsets();
  return (
    <View style={[styles.bar, { paddingBottom: 6 + Math.min(insets.bottom, 16) }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [styles.item, pressed ? { opacity: 0.65 } : null]}
          >
            <View style={[styles.iconWrap, isActive ? styles.iconWrapActive : null]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={20}
                color={isActive ? colors.primary : colors.textMuted}
              />
            </View>
            <Txt
              size={9.5}
              weight={isActive ? "bold" : "regular"}
              color={isActive ? colors.primary : colors.textMuted}
            >
              {tab.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 7,
    paddingBottom: 6,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  iconWrap: {
    width: 46,
    height: 27,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.primarySurface,
  },
});
