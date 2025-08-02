/**
 * UI-related types for forms, alerts, modals, etc.
 */

import { ReactNode } from 'react';

// Form types
export interface FormField<T = string> {
  value: T;
  setValue: (value: T) => void;
}

export interface FormStateConfig {
  [key: string]: any;
}

export type FormStateReturn<T extends FormStateConfig> = {
  [K in keyof T]: FormField<T[K]>;
} & {
  resetForm: () => void;
  getFormValues: () => T;
  setFormValues: (values: Partial<T>) => void;
};

export interface FormModalState {
  visible: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// Alert types
export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

export interface MultiOptionAlert {
  title: string;
  message: string;
  options: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

// Modal types
export interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: ReactNode;
}

export interface FormModalProps extends ModalProps {
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
}

// Menu state
export interface MenuState {
  openMenuId: string | null;
  openMenu: (id: string) => void;
  closeMenu: () => void;
  isMenuOpen: (id: string) => boolean;
}