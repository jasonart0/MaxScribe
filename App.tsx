import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// Update the import path to the correct location of your screens
import { Notes, PatientDetail, VoiceRecordScreen } from "@screens";
import SplashAnimation from "components/AnimatedSplash";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { LogBox } from "react-native";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AddEncounter from "screens/voice/Encounter";
import Login from "./app/screens/auth/loginScreen";
import Home from "./app/screens/home/homeScreen";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Transcript from "screens/voice/Transcription";
LogBox.ignoreAllLogs();

const Stack = createNativeStackNavigator();
// SplashScreen.preventAutoHideAsync();
export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  const handleAnimationEnd = React.useCallback(async () => {
    setShowSplash(false);
    await SplashScreen.hideAsync(); // hide native splash
  }, []);

  if (showSplash) {
    return <SplashAnimation onAnimationEnd={handleAnimationEnd} />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Stack.Screen name="Transcript" component={Transcript} />
            <Stack.Screen name="Notes" component={Notes} />
            <Stack.Screen name="PatientDetails" component={PatientDetail} />
            <Stack.Screen name="AddEncounter" component={AddEncounter} />
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
