import { COLORS } from 'constants/Colors';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
export default function AppBackground({children}: {children: ReactNode}) {
 return <View style={styles.root}>
  <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
   <View style={[styles.circle, styles.top]} />
   <View style={[styles.circle, styles.right]} />
   <View style={[styles.circle, styles.bottom]} />
   <View style={[styles.circle, styles.left]} />
  </View>
  {children}
 </View>;
}
const styles = StyleSheet.create({
 root: {flex: 1, backgroundColor: COLORS.background, overflow: 'hidden'},
 circle: {position: 'absolute', borderRadius: 999, backgroundColor: '#EAF4FC'},
 top: {width: 300, height: 300, right: -154, top: -154, opacity: 0.25},
 right: {width: 112, height: 112, right: -72, top: '40%', opacity: 0.2},
 bottom: {width: 320, height: 320, right: -190, bottom: -178, opacity: 0.22},
 left: {width: 132, height: 132, left: -96, bottom: '24%', opacity: 0.18},
});
