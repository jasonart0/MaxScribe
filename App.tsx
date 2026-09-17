import { GestureHandlerRootView } from "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
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
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { RootStackParamList } from "./app/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [showSplashScreens, setShowSplashScreens] = useState(true);

  if (showSplashScreens) {
    return <SafeAreaProvider><SplashScreens onComplete={() => setShowSplashScreens(false)} /></SafeAreaProvider>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <FlashMessage position={'top'} />
      <BottomSheetModalProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
