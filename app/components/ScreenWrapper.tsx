import { useIsFocused } from "@react-navigation/native";
import React, { Fragment, ReactNode } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StatusBarProps,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { setHeight, setWidth } from "@lib";
import { COLORS } from "constants/Colors";
import HeaderTitle from "./HeadTitle";

interface ScreenWrapperProps {
  children: ReactNode;
  transclucent?: boolean;
  scrollEnabled?: boolean;
  backgroundImage?: any;
  containerViewStyle?: object;
  contentContainerStyle?: object;
  headerUnScrollable?: (t: any, s: any) => ReactNode;
  title: string;
  showback?: boolean;
  footerUnScrollable?: () => ReactNode;
  backgroundColor?: string;
  imageBackgroundColor?: string;
  barStyle?: StatusBarProps["barStyle"];
  loading?: boolean;
  statusBarColor?: string;
  onTouchEnd?: () => void;
}

const ScreenWrapper = ({
  children,
  title,
  showback = true,
  transclucent = false,
  scrollEnabled = false,
  backgroundImage,
  containerViewStyle = {},
  contentContainerStyle = {},
  headerUnScrollable = (t, s) => {
    return (
      <View
        style={{
          backgroundColor: COLORS.background,
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <HeaderTitle title={t} showback={s} />
      </View>
    );
  },
  footerUnScrollable = () => null,
  backgroundColor = COLORS.background,
  imageBackgroundColor = COLORS.background,
  barStyle = "dark-content",
  loading = false,
  statusBarColor = COLORS.background, // Default value from AppColors
  onTouchEnd,
}: ScreenWrapperProps) => {
  if (backgroundImage) {
    backgroundColor = "transparent"; // Assuming AppColors.transparent is defined appropriately
  }

  const FocusAwareStatusBar: React.FC<StatusBarProps> = (props) => {
    const isFocused = useIsFocused();
    return isFocused ? <StatusBar {...props} /> : null;
  };
  const content = () => (
    <Fragment>
      {headerUnScrollable(title, showback)}
      {loading ? (
        <ActivityIndicator
          size={"large"}
          color={"black"}
          style={{ paddingVertical: setHeight(2) }}
        />
      ) : (
        <View
          style={[
            styles.mainViewContainer,
            containerViewStyle,
            {
              backgroundColor: transclucent
                ? COLORS.background
                : backgroundColor,
            },
          ]}
        >
          {scrollEnabled ? (
            <KeyboardAwareScrollView
              contentContainerStyle={[
                styles.contentContainer,
                contentContainerStyle,
              ]}
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={setHeight(8)}
              showsVerticalScrollIndicator={false}
              onTouchEnd={onTouchEnd}
            >
              {children}
            </KeyboardAwareScrollView>
          ) : (
            children
          )}
          {footerUnScrollable && (
            <View style={{ marginBottom: setHeight(2) }}>
              {footerUnScrollable()}
            </View>
          )}
        </View>
      )}
    </Fragment>
  );

  return (
    <Fragment>
      <FocusAwareStatusBar
        barStyle={barStyle}
        backgroundColor={statusBarColor}
        // translucent={transclucent}
      />
      {!transclucent && (
        <SafeAreaView style={{ backgroundColor: COLORS.background }} />
      )}
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={[
            styles.container,
            {
              height: setHeight(30), // Replace with your actual height function call
              marginTop: setWidth(7), // Replace with your actual width function call
            },
            { backgroundColor: imageBackgroundColor },
          ]}
          resizeMode="center"
        >
          {content()}
        </ImageBackground>
      ) : (
        content()
      )}
    </Fragment>
  );
};

export default ScreenWrapper;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainViewContainer: {
    flex: 1,
  },
  contentContainer: {
    // paddingVertical: setHeight(2),
    // flex: 1,
  },
});
