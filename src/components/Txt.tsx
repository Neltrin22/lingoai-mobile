import React from "react";
import { Text, type TextProps } from "react-native";
import { colors, fonts } from "../theme";

type Weight = "regular" | "medium" | "semiBold" | "bold" | "extraBold";

export type TxtProps = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  center?: boolean;
};

/** Texto con la tipografía Outfit y tamaños consistentes en toda la app. */
export function Txt({
  size = 14,
  weight = "regular",
  color = colors.text,
  center,
  style,
  ...rest
}: TxtProps) {
  return (
    <Text
      style={[
        { fontFamily: fonts[weight], fontSize: size, color },
        center ? { textAlign: "center" } : null,
        style,
      ]}
      {...rest}
    />
  );
}

export default Txt;
