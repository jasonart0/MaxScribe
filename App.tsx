import { GestureHandlerRootView } from "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Dimensions } from "react-native";
import FlashMessage from "react-native-flash-message";
import SplashScreens from "./app/components/SplashScreens";
import Login from "./app/screens/auth/loginScreen";
import Home from "./app/screens/home/homeScreen";
import PatientDetail from "./app/screens/home/PatientDetail";
import Encounter from "./app/screens/voice/Encounter";
import Notes from "./app/screens/voice/Notes";
import Transcription from "./app/screens/voice/Transcription";
import VoiceRecordScreen from "./app/screens/voice/ViceRecorder";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import type { RootStackParamList } from "./app/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      {showSplashScreens ? <SplashScreens onComplete={() => setShowSplashScreens(false)} /> : <>
      <FlashMessage position={'top'} />
      <BottomSheetModalProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false, animation: "fade_from_bottom", animationDuration: 260, gestureEnabled: true }}
          >
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Voice" component={VoiceRecordScreen} />
            <Stack.Screen name="Transcript" component={Transcription} />
            <Stack.Screen name="Notes" component={Notes} />
            <Stack.Screen name="PatientDetails" component={PatientDetail} />
            <Stack.Screen name="AddEncounter" component={Encounter} />
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
      </>}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
