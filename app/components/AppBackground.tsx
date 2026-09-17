import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export default function AppBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <View style={[styles.circle, styles.top]} />
        <View style={[styles.circle, styles.right]} />
        <View style={[styles.circle, styles.bottom]} />
        <View style={[styles.circle, styles.left]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EAF4FB',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  top: { width: 360, height: 360, right: -150, top: -150, opacity: 0.9 },
  right: { width: 200, height: 200, right: -80, top: '42%', opacity: 0.7 },
  bottom: { width: 400, height: 400, left: -160, bottom: -180, opacity: 0.8 },
  left: { width: 180, height: 180, left: -60, bottom: '18%', opacity: 0.6 },
});
