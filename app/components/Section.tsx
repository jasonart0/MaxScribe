import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { isNotEmpty, setHeight, setWidth } from "@lib";
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
  notShow,
  onPressEdit,
}: any) {
  const [open, setOpen] = useState(true);
  const { width } = useWindowDimensions();

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const renderContent = (item, idx) => {
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
                {v}
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
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            width: setWidth(57),
          }}
        >
          <MaterialCommunityIcons
            name={icon || "folder-outline"}
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.title}>{title}</Text>
        </View>
        {editable && (
          <TouchableOpacity
            onPress={onPressEdit}
            activeOpacity={0.8}
            style={styles.button}
          >
            <Text style={styles.text}>Edit</Text>
            {/* <Ionicons name="pencil" size={16} color={COLORS.primary} /> */}
          </TouchableOpacity>
        )}
        <Ionicons
          style={{ marginRight: 8 }}
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.primary}
        />
      </TouchableOpacity>

      {/* Content */}
      {open && <View style={styles.content}>{items.map(renderContent)}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: setWidth(95),
    backgroundColor: "white",
    borderRadius: setHeight(1),
    marginVertical: setHeight(0.5),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: setHeight(2),
    padding: setHeight(2),
    margin: setHeight(1),
    backgroundColor: COLORS.secondary,
    borderRadius: setHeight(1),
  },
  title: { fontSize: 15, fontWeight: "bold", color: COLORS.primary },
  content: { paddingHorizontal: 16, paddingBottom: 12 },
  htmlText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
  objectBox: {
    marginVertical: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  objectText: { fontSize: 14, color: COLORS.text, marginBottom: 2 },
  objectKey: { fontWeight: "600", color: COLORS.text },
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  text: {
    color: COLORS.primary,
    fontWeight: "500",
  },
});

const markdownStyles = {
  body: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  strong: {
    fontWeight: "bold",
  },
};
