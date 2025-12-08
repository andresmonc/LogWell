import React from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';

/**
 * Web-compatible header button component
 * 
 * React Native Paper's Button component doesn't handle clicks reliably
 * in React Navigation headers on web. This component automatically uses
 * Pressable on web for better compatibility while maintaining the same
 * visual appearance.
 * 
 * Usage in navigation headers:
 * ```tsx
 * navigation.setOptions({
 *   headerRight: () => (
 *     <HeaderButton onPress={handleSave} mode="contained">
 *       Save
 *     </HeaderButton>
 *   ),
 * });
 * ```
 */
export interface HeaderButtonProps extends Omit<ButtonProps, 'children'> {
  children: string;
  /** Custom text color (defaults to theme primary for contained, onSurface for text) */
  textColor?: string;
  /** Custom font size (defaults to 17) */
  fontSize?: number;
  /** Custom font weight (defaults to '600') */
  fontWeight?: TextStyle['fontWeight'];
}

export default function HeaderButton({
  children,
  mode = 'text',
  onPress,
  disabled = false,
  textColor,
  fontSize = 17,
  fontWeight = '600',
  style,
  contentStyle,
  labelStyle,
  ...buttonProps
}: HeaderButtonProps) {
  const theme = useTheme();

  // On web, use Pressable for better click handling
  if (Platform.OS === 'web') {
    // Determine text color based on mode if not provided
    const finalTextColor = textColor || 
      (mode === 'contained' ? theme.colors.onPrimary : theme.colors.primary);

    // Determine background color for contained mode
    const backgroundColor = mode === 'contained' && !disabled
      ? theme.colors.primary
      : 'transparent';

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }): ViewStyle => ({
          ...styles.pressable,
          ...(style as ViewStyle),
          backgroundColor: disabled ? theme.colors.surfaceDisabled : backgroundColor,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
        })}
      >
        <Text
          style={[
            styles.text,
            labelStyle as TextStyle,
            {
              color: disabled ? theme.colors.onSurfaceDisabled : finalTextColor,
              fontSize,
              fontWeight,
            } as TextStyle,
          ]}
        >
          {children}
        </Text>
      </Pressable>
    );
  }

  // On native, use the regular Button component
  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      textColor={textColor}
      style={style}
      contentStyle={contentStyle}
      labelStyle={[{ fontSize, fontWeight } as TextStyle, labelStyle]}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
