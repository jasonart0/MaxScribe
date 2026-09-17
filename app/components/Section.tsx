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
  defaultOpen = false,
}: any) {
  const [open, setOpen] = useState(defaultOpen);
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => setOpen(!open)}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={icon || "folder-outline"}
              size={18}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (editable && onPressEdit) {
              onPressEdit();
              return;
            }
            setOpen(!open);
          }}
          activeOpacity={0.8}
          style={styles.headerRight}
        >
          {editable && onPressEdit ? (
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color={COLORS.primary}
            />
          ) : (
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      {open && <View style={styles.content}>{items.map(renderContent)}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(29,115,188,0.12)",
    backgroundColor: "rgba(255,255,255,0.44)",
    overflow: "hidden",
    shadowColor: "#0F4479",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29,115,188,0.12)",
  },
  title: {
    flexShrink: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#3C4653",
  },
  headerRight: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
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
    borderColor: "rgba(29,115,188,0.08)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  objectText: { fontSize: 14, color: COLORS.text, marginBottom: 2 },
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
