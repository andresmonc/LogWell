import { Alert, AlertButton } from 'react-native';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

export const showConfirmation = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false
}: ConfirmationOptions) => {
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
  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const showSuccess = (message: string, title: string = 'Success') => {
  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

interface MultiOptionAlert {
  title: string;
  message: string;
  options: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
}

export const showMultiOptionAlert = ({ title, message, options }: MultiOptionAlert) => {
  const buttons: AlertButton[] = options.map(option => ({
    text: option.text,
    style: option.style || 'default',
    onPress: option.onPress
  }));

  Alert.alert(title, message, buttons);
};