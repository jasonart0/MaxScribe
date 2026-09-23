import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import FlashMessage from "react-native-flash-message";
import Login from "./screens/auth/loginScreen";
import Home from "./screens/home/homeScreen";
import PatientDetail from "./screens/home/PatientDetail";
import Encounter from "./screens/voice/Encounter";
import Notes from "./screens/voice/Notes";
import Transcription from "./screens/voice/Transcription";
import VoiceRecordScreen from "./screens/voice/ViceRecorder";
import type { RootStackParamList } from "./types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainApp() {
  return <>
    <FlashMessage position="top" />
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
  </>;
}
