import { GestureHandlerRootView } from "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashAnimation from "components/AnimatedSplash";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import FlashMessage from "react-native-flash-message";
import Login from "./app/screens/auth/loginScreen";
import Home from "./app/screens/home/homeScreen";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

const Stack = createNativeStackNavigator();
SplashScreen.preventAutoHideAsync().catch(() => {
  // The native splash may already be hidden during fast refresh.
});

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Keep rendering if the native splash was already hidden.
    });
  }, []);

  const handleAnimationEnd = React.useCallback(() => {
    setShowSplash(false);
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
            <Stack.Screen
              name="Voice"
              getComponent={() =>
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require("./app/screens/voice/ViceRecorder").default
              }
            />
            <Stack.Screen
              name="Transcript"
              getComponent={() =>
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require("./app/screens/voice/Transcription").default
              }
            />
            <Stack.Screen
              name="Notes"
              getComponent={() => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                return require("./app/screens/voice/Notes").default;
              }}
            />
            <Stack.Screen
              name="PatientDetails"
              getComponent={() =>
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require("./app/screens/home/PatientDetail").default
              }
            />
            <Stack.Screen
              name="AddEncounter"
              getComponent={() => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                return require("./app/screens/voice/Encounter").default;
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
