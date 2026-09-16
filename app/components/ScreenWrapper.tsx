import { useIsFocused } from '@react-navigation/native';
import { COLORS } from 'constants/Colors';
import { THEME } from 'constants/Theme';
import React, { ReactNode } from 'react';
import { ActivityIndicator, ImageBackground, StatusBar, StatusBarProps, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from './AppBackground';
import HeaderTitle from './HeadTitle';

interface ScreenWrapperProps {
 children: ReactNode; transclucent?: boolean; scrollEnabled?: boolean; backgroundImage?: any;
 containerViewStyle?: object; contentContainerStyle?: object;
 headerUnScrollable?: (t: any, s: any) => ReactNode; title?: string; showback?: boolean;
 footerUnScrollable?: () => ReactNode; backgroundColor?: string; imageBackgroundColor?: string;
 barStyle?: StatusBarProps['barStyle']; loading?: boolean; statusBarColor?: string; onTouchEnd?: () => void;
}
export default function ScreenWrapper({children, title, showback = true, scrollEnabled = false,
 backgroundImage, containerViewStyle, contentContainerStyle, headerUnScrollable, footerUnScrollable,
 barStyle = 'dark-content', loading = false, statusBarColor = COLORS.background, onTouchEnd}: ScreenWrapperProps) {
 const focused = useIsFocused();
 const footer = footerUnScrollable?.();
 const content = <SafeAreaView style={styles.safe}>
  {focused && <StatusBar barStyle={barStyle} backgroundColor={statusBarColor} />}
  <View style={styles.layout}>
   {headerUnScrollable ? headerUnScrollable(title, showback) : <HeaderTitle title={title} showback={showback} />}
   <View style={[styles.body, styles.transparent, containerViewStyle]}>
    {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>
     : scrollEnabled ? <KeyboardAwareScrollView style={styles.body} contentContainerStyle={[styles.scroll, contentContainerStyle]}
      keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={THEME.spacing.lg}
      showsVerticalScrollIndicator={false} onTouchEnd={onTouchEnd}>{children}</KeyboardAwareScrollView> : children}
   </View>
   {footer != null && footer !== false && <View style={styles.footer}>{footer}</View>}
  </View>
 </SafeAreaView>;
 return <AppBackground>{backgroundImage ? <ImageBackground source={backgroundImage} style={styles.body} resizeMode="cover">{content}</ImageBackground> : content}</AppBackground>;
}
const styles = StyleSheet.create({
 safe: {flex: 1, backgroundColor: 'transparent'},
 layout: {flex: 1, width: '100%', maxWidth: THEME.contentWidth, alignSelf: 'center'},
 body: {flex: 1}, transparent: {backgroundColor: 'transparent'},
 scroll: {flexGrow: 1, paddingBottom: THEME.spacing.lg},
 footer: {paddingHorizontal: THEME.spacing.lg, paddingVertical: THEME.spacing.sm, backgroundColor: 'transparent'},
 loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
