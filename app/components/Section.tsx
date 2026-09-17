import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { isNotEmpty } from "@lib";
import { COLORS } from "constants/Colors";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Markdown from "react-native-markdown-display";
import RenderHTML from "react-native-render-html";

export default function CollapsibleSection({
  title,
  data,
  icon,
  editable,
  notShow = [],
  onPressEdit,
}: any) {
  const [open, setOpen] = useState(true);
  const { width } = useWindowDimensions();

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const renderContent = (item: unknown, idx: number) => {
    if (!item) return null;
    // if(title==="Allergies"){
    // return <EditableForm sections={data} />;
    // }
    // --- Handle string / HTML ---
    if (typeof item === "string") {
      const isHTML = /<\/?[a-z][\s\S]*>/i.test(item);

      return isHTML ? (
        <RenderHTML
          key={idx}
          contentWidth={width - 32}
          source={{ html: item }}
          baseStyle={styles.htmlText}
        />
      ) : (
        <Markdown key={idx} style={markdownStyles}>
          {item}
        </Markdown>
      );
    }

    // --- Handle object ---
    if (typeof item === "object") {
      return (
        <View key={idx} style={styles.objectBox}>
          {Object.entries(item).map(([k, v]) => {
            if (notShow.includes(k)) return;
            if (!isNotEmpty(v)) return;
            return (
              <Text key={k} style={styles.objectText}>
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </Text>
            );
          })}
        </View>
      );
    }

    return null;
  };

  const items = Array.isArray(data) ? data : [data];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={icon || "folder-outline"}
              size={18}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.headerRight}>
          {editable && (
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                onPressEdit?.();
              }}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text style={styles.text}>Edit</Text>
            </TouchableOpacity>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={COLORS.primary}
          />
        </View>
      </TouchableOpacity>

      {open && <View style={styles.content}>{items.map(renderContent)}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE8F6",
    backgroundColor: "#F5F9FF",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 12,
    backgroundColor: "#EAF3FF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 93, 223, 0.08)",
  },
  title: {
    flexShrink: 1,
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  htmlText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
  objectBox: {
    marginVertical: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2EAF4",
    borderRadius: 8,
    backgroundColor: "#F7FAFF",
  },
  objectText: { fontSize: 14, color: COLORS.text, marginBottom: 2 },
  button: {
    minWidth: 52,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    backgroundColor: "rgba(11, 95, 217, 0.08)",
  },
  text: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 12,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  strong: {
    fontWeight: "bold",
  },
});
