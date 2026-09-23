import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { Suspense, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from "react-native";
import SplashScreens from "./app/components/SplashScreens";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

// Keep the first web render small. Metro splits this dynamic import on web,
// allowing onboarding to paint before navigation, editors, and voice modules load.
const MainApp = React.lazy(() => import("./app/MainApp"));

function AppLoading() {
  return <View style={styles.loading}>
    <ActivityIndicator size="large" color="#FFFFFF" />
    <Text style={styles.loadingText}>Loading workspace...</Text>
  </View>;
}

export default function App() {
  const [showSplashScreens, setShowSplashScreens] = useState(true);
  // Scene startup can precede native safe-area metrics. Render immediately,
  // then let the provider update the insets when its native event arrives.
  const [startupMetrics] = useState(() => initialWindowMetrics ?? {
    frame: { x: 0, y: 0, width: Dimensions.get("window").width, height: Dimensions.get("window").height },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={startupMetrics}>
      {showSplashScreens
        ? <SplashScreens onComplete={() => setShowSplashScreens(false)} />
        : <Suspense fallback={<AppLoading />}><MainApp /></Suspense>}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2B69C1" },
  loadingText: { marginTop: 14, color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
