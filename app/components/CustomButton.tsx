import { COLORS } from 'constants/Colors';
import { THEME } from 'constants/Theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import BlueGradient from './BlueGradient';

type Props = { title: string; onPress: () => void; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; isLoading?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' | 'neon' };

export default function CustomButton({ title, onPress, style, textStyle, isLoading, disabled = false, variant = 'primary' }: Props) {
  const secondary = variant === 'secondary';
  const neon = variant === 'neon';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || !!isLoading, busy: !!isLoading }}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={[styles.button, secondary && styles.secondary, neon && styles.neon, style, disabled && !isLoading && { opacity: 0.5 }]}
    >
      {!secondary && !neon && <BlueGradient />}
      <Text style={[styles.text, secondary && { color: COLORS.primary }, neon && { color: '#A0FFF3' }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    backgroundColor: '#2B69C1',
    minHeight: 52,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#0A54A3',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  secondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary },
  neon: { backgroundColor: 'rgba(2,219,196,0.08)', borderWidth: 1.2, borderColor: '#02DBC4',
    shadowColor: '#02DBC4', shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  text: {
    color: COLORS.card,
    fontWeight: '700',
    fontSize: THEME.type.body,
    textAlign: 'center',
  },
});
