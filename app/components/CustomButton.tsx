import { COLORS } from 'constants/Colors';
import { THEME } from 'constants/Theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
type Props = { title: string; onPress: () => void; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; isLoading?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' };
export default function CustomButton({title, onPress, style, textStyle, isLoading, disabled = false, variant = 'primary'}: Props) {
 const secondary = variant === 'secondary';
 return <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: disabled || !!isLoading, busy: !!isLoading}}
  disabled={disabled || isLoading} onPress={onPress} style={[styles.button, secondary && styles.secondary, style, disabled && {opacity: 0.5}]}>
  {isLoading ? <ActivityIndicator color={secondary ? COLORS.primary : COLORS.card} />
   : <Text style={[styles.text, secondary && {color: COLORS.primary}, textStyle]}>{title}</Text>}
 </TouchableOpacity>;
}
const styles = StyleSheet.create({
 button: {backgroundColor: COLORS.primary, minHeight: THEME.control.height, paddingVertical: THEME.spacing.sm,
  paddingHorizontal: THEME.spacing.lg, borderRadius: THEME.radius.control, alignItems: 'center',
  justifyContent: 'center', width: '100%', alignSelf: 'center'},
 secondary: {backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary},
 text: {color: COLORS.card, fontWeight: '600', fontSize: THEME.type.body, textAlign: 'center'},
});
