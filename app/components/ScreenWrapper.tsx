import { useIsFocused } from '@react-navigation/native';
import { THEME } from 'constants/Theme';
import React, { ReactNode } from 'react';
import { ImageBackground, StatusBarProps, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from './AppBackground';
import HeaderTitle from './HeadTitle';
import GradientStatusBar from './GradientStatusBar';
import PageLoader from './PageLoader';

interface ScreenWrapperProps {
 children: ReactNode; transclucent?: boolean; scrollEnabled?: boolean; backgroundImage?: any;
 containerViewStyle?: object; contentContainerStyle?: object;
 headerUnScrollable?: (t: any, s: any) => ReactNode; title?: string; showback?: boolean;
 footerUnScrollable?: () => ReactNode; backgroundColor?: string; imageBackgroundColor?: string;
 background?: ReactNode;
 barStyle?: StatusBarProps['barStyle']; loading?: boolean; loadingMessage?: string; statusBarColor?: string; onTouchEnd?: () => void;
}
export default function ScreenWrapper({children, title, showback = true, scrollEnabled = false,
 backgroundImage, containerViewStyle, contentContainerStyle, headerUnScrollable, footerUnScrollable,
 loading = false, loadingMessage, onTouchEnd, background}: ScreenWrapperProps) {
 const focused = useIsFocused();
 const footer = footerUnScrollable?.();
 const content = <View style={styles.body}>
  {focused && <GradientStatusBar />}
  <SafeAreaView style={styles.safe}>
   <View style={styles.layout}>
   {headerUnScrollable ? headerUnScrollable(title, showback) : <HeaderTitle title={title} showback={showback} />}
   <View style={[styles.body, styles.transparent, containerViewStyle]}>
    {scrollEnabled ? <KeyboardAwareScrollView style={styles.body} contentContainerStyle={[styles.scroll, contentContainerStyle]}
      keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={THEME.spacing.lg}
      showsVerticalScrollIndicator={false} onTouchEnd={onTouchEnd}>{children}</KeyboardAwareScrollView> : children}
   </View>
   {footer != null && footer !== false && <View style={styles.footer}>{footer}</View>}
   <PageLoader visible={loading} message={loadingMessage} />
   </View>
  </SafeAreaView>
 </View>;
 const scene = backgroundImage ? <ImageBackground source={backgroundImage} style={styles.body} resizeMode="cover">{content}</ImageBackground> : content;
 return background ? <View style={styles.body}>{background}{scene}</View> : <AppBackground>{scene}</AppBackground>;
}
const styles = StyleSheet.create({
 safe: {flex: 1, backgroundColor: 'transparent'},
 layout: {flex: 1, width: '100%', maxWidth: THEME.contentWidth, alignSelf: 'center'},
 body: {flex: 1}, transparent: {backgroundColor: 'transparent'},
 scroll: {flexGrow: 1, paddingBottom: THEME.spacing.lg},
 footer: {paddingHorizontal: THEME.spacing.lg, paddingVertical: THEME.spacing.sm, backgroundColor: 'transparent'},
});
