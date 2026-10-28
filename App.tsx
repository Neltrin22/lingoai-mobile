import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomNav } from "./src/components/BottomNav";
import { Txt } from "./src/components/Txt";
import { ChatScreen } from "./src/screens/ChatScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { AppProvider, useApp } from "./src/state/store";
import { colors } from "./src/theme";
import type { Tab } from "./src/types";

function Splash() {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.splash}
    >
      <View style={styles.logoBox}>
        <Txt size={34}>🧠</Txt>
      </View>
      <Txt size={28} weight="extraBold" color={colors.white} style={{ marginTop: 16 }}>
        LingoAI
      </Txt>
      <Txt size={12} color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>
        Tu tutor personal de inglés
      </Txt>
      <ActivityIndicator color={colors.white} style={{ marginTop: 28 }} />
    </LinearGradient>
  );
}

function Root({ fontsReady }: { fontsReady: boolean }) {
  const { state, hydrated, actions } = useApp();
  const [tab, setTab] = useState<Tab>("dashboard");

  /* Botón atrás de Android: vuelve al inicio en vez de cerrar la app. */
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "dashboard") {
        setTab("dashboard");
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [tab]);

  if (!hydrated || !fontsReady) return <Splash />;

  if (!state.onboarded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <StatusBar style="dark" />
        <OnboardingScreen
          onDone={(level, name) => {
            actions.completeOnboarding(level, name);
            setTab("chat");
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={tab === "dashboard" ? "light" : "dark"} />
      <View style={{ flex: 1 }}>
        {tab === "dashboard" && (
          <DashboardScreen
            onOpenChat={() => setTab("chat")}
            onOpenProgress={() => setTab("progress")}
          />
        )}
        {tab === "chat" && <ChatScreen onOpenProgress={() => setTab("progress")} />}
        {tab === "progress" && <ProgressScreen />}
        {tab === "profile" && <ProfileScreen />}
      </View>
      <BottomNav active={tab} onChange={setTab} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root fontsReady={fontsLoaded || !!fontError} />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
