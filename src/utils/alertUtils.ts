import { Alert, AlertButton, Platform } from 'react-native';
import type { ConfirmationOptions, MultiOptionAlert } from '../types/ui';

export const showConfirmation = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false
}: ConfirmationOptions) => {
  if (Platform.OS === 'web') {
    // Use browser's native confirm dialog on web
    const fullMessage = title ? `${title}\n\n${message}` : message;
    const confirmed = window.confirm(fullMessage);
    if (confirmed) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
    return;
  }

  const buttons: AlertButton[] = [
    {
      text: cancelText,
      style: 'cancel',
      onPress: onCancel
    },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm
    }
  ];

  Alert.alert(title, message, buttons);
};

export const showError = (message: string, title: string = 'Error') => {
  if (Platform.OS === 'web') {
    // Use browser's native alert on web
    const fullMessage = title ? `${title}\n\n${message}` : message;
    window.alert(fullMessage);
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const showSuccess = (message: string, title: string = 'Success') => {
  if (Platform.OS === 'web') {
    // Use browser's native alert on web
    const fullMessage = title ? `${title}\n\n${message}` : message;
    window.alert(fullMessage);
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};



export const showMultiOptionAlert = ({ title, message, options }: MultiOptionAlert) => {
  if (Platform.OS === 'web') {
    // For web, show a simple confirm dialog and call the first option's onPress
    // This is a limitation - multi-option alerts on web will only show the first option
    // For better UX, we could implement a proper Dialog component later
    const fullMessage = title ? `${title}\n\n${message}` : message;
    const confirmed = window.confirm(fullMessage);
    if (confirmed && options.length > 0) {
      // Find the first non-cancel option, or use the first option
      const actionOption = options.find(opt => opt.style !== 'cancel') || options[0];
      actionOption.onPress?.();
    } else {
      // Find cancel option or do nothing
      const cancelOption = options.find(opt => opt.style === 'cancel');
      cancelOption?.onPress?.();
    }
    return;
  }

  const buttons: AlertButton[] = options.map(option => ({
    text: option.text,
    style: option.style || 'default',
    onPress: option.onPress
  }));

  Alert.alert(title, message, buttons);
};