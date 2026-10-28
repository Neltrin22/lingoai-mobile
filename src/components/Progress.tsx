import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

export function CircularProgress({
  value,
  size = 72,
  stroke = 7,
  color = colors.primary,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (safeValue / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height: 9,
        backgroundColor: colors.divider,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${safe}%`,
          borderRadius: 8,
          backgroundColor: color,
          opacity: 0.9,
        }}
      />
    </View>
  );
}
