import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "constants/Colors";
import { baseURL } from "constants/base";
import React, { useEffect, useMemo, useState } from "react";
import {
    GestureResponderEvent,
    Image,
    ImageStyle,
    Pressable,
    Text,
    TextStyle,
    View,
    ViewStyle
} from "react-native";
type AvatarInitialsProps = {
  name?: string | null;                // full name, e.g. "NEWMAN, DEMO" or "Demo Newman"
  size?: number;                       // circle diameter in px (default 48)
  color?: string;                      // text color (default white)
  fontSize?: number;                   // font size override
  style?: ViewStyle;                   // additional container style
  imageUri?: string | null;            // optional avatar image uri - if present, will show image
  onPress?: (e: GestureResponderEvent) => void; // optional press handler
  rounded?: boolean;                   // true -> circle, false -> rounded square
};

const DEFAULT_SIZE = 48;

function nameToInitials(name?: string | null) {
  if (!name) return "?";

  // Normalize: remove commas and extra spaces
  const cleaned = name.replace(/\s+/g, " ").trim(); // collapse spaces
  // Try splitting by comma if format "LAST, FIRST"
  let parts: string[] = [];
  if (cleaned.includes(",")) {
    // Example "NEWMAN, DEMO" -> ["DEMO", "NEWMAN"]
    const commaParts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
    // prefer first word of first part (first name) and first of second part (last name)
    if (commaParts.length >= 2) {
      parts = [commaParts[1], commaParts[0]];
    } else {
      parts = cleaned.split(" ");
    }
  } else {
    parts = cleaned.split(" ").filter(Boolean);
  }

  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    // Single token, take first two letters if possible
    const token = parts[0];
    return token.slice(0, 2).toUpperCase();
  }

  // Take first letter of first and last tokens
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return (first + last).toUpperCase();
}

export default function AvatarInitials({
  name,
  size = DEFAULT_SIZE,
  color = COLORS.primary,
  fontSize,
  style,
  imageUri,
  onPress,
  rounded = true,
}: AvatarInitialsProps) {
  const initials = useMemo(() => nameToInitials(name), [name]);
  const [token, setToken] = useState<string | null>(null);
  const [failedImageUri, setFailedImageUri] = useState<string | null>(null);
  const appliedFontSize = fontSize ?? Math.min(
    Math.max(10, Math.round(size * 0.38)),
    initials.length > 2 ? Math.round(size * 0.28) : Math.round(size * 0.42),
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("token").then((storedToken) => {
      if (mounted) setToken(storedToken);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: rounded ? size / 2 : Math.max(6, size * 0.12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
    overflow: "hidden",
  };

  const textStyle: TextStyle = {
    color,
    fontSize: appliedFontSize,
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
  };

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: rounded ? size / 2 : Math.max(6, size * 0.12),
  };

  let protectedImage = false;
  try { protectedImage = !!imageUri && new URL(imageUri).origin === new URL(baseURL).origin; }
  catch { /* Invalid image URLs fall back to initials through onError. */ }
  const content = imageUri && failedImageUri !== imageUri && (!protectedImage || token) ? (
    <Image
      source={{
        uri: imageUri,
        headers: protectedImage && token ? { Authorization: `Bearer ${token}` } : undefined,
      }}
      style={imageStyle}
      resizeMode="cover"
      onError={() => setFailedImageUri(imageUri)}
    />
  ) : (
    <Text style={textStyle} accessibilityLabel={`Avatar ${initials}`}>
      {initials}
    </Text>
  );

  return onPress ? (
    <Pressable onPress={onPress} style={[containerStyle, style]}>
      {content}
    </Pressable>
  ) : (
    <View style={[containerStyle, style]}>{content}</View>
  );
}
