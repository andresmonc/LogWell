import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Snackbar, useTheme } from 'react-native-paper';
import type { Toast } from '../types/toast';

interface ToastManagerProps {
  toasts: Toast[];
  onHide: (id: string) => void;
}

export function ToastManager({ toasts, onHide }: ToastManagerProps) {
  const theme = useTheme();

  // Only show the most recent toast to avoid stacking
  const currentToast = toasts[toasts.length - 1];

  if (!currentToast) {
    return null;
  }

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.onPrimary,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          color: theme.colors.onError,
        };
      case 'warning':
        return {
          backgroundColor: '#f57c00', // Orange
          color: '#fff',
        };
      case 'info':
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.onSurface,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.onSurface,
        };
    }
  };

  const toastStyles = getToastStyles(currentToast.type);

  return (
    <View style={styles.container}>
      <Snackbar
        visible={true}
        onDismiss={() => onHide(currentToast.id)}
        duration={currentToast.duration}
        action={currentToast.action}
        style={[styles.snackbar, { backgroundColor: toastStyles.backgroundColor }]}
        theme={{
          ...theme,
          colors: {
            ...theme.colors,
            onSurface: toastStyles.color,
            inverseSurface: toastStyles.backgroundColor,
            inverseOnSurface: toastStyles.color,
          }
        }}
      >
        {currentToast.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  snackbar: {
    margin: 16,
    borderRadius: 8,
  },
});