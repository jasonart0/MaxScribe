import { setHeight } from "@lib";
import { COLORS } from "constants/Colors";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

export default function EditableNote({
  htmlContent,
  setHtmlContent,
  results,
  finalResult,
}) {
  const richText = useRef(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (finalResult && richText.current) {
      richText.current.insertText(` ${finalResult}`);
    }
  }, [finalResult]);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={COLORS.primary} />}
      <RichEditor
        ref={richText}
        initialContentHTML={htmlContent}
        onChange={setHtmlContent}
        editorInitializedCallback={() => setLoading(false)}
        editorStyle={{ backgroundColor: "#fff" }}
      />

      <RichToolbar
        editor={richText}
        actions={[
          actions.undo,
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.heading1,
          actions.checkboxList,
          actions.redo,
        ]}
      />
      {results && (
        <Text
          style={{
            backgroundColor: COLORS.secondary,
            padding: setHeight(2),
            margin: setHeight(2),
          }}
        >
          {results}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f8f8f8" },
});
