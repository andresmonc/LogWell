import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Portal } from 'react-native-paper';
import { ToastManager } from '../components/ToastManager';
import { setGlobalToastRef } from '../utils/toastUtils';
import type { Toast, ToastConfig, ToastContextValue } from '../types/toast';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const showToast = useCallback((config: ToastConfig) => {
    const id = generateId();
    const toast: Toast = {
      id,
      ...config,
      duration: config.duration ?? 4000, // Default 4 seconds
    };

    setToasts(prev => [...prev, toast]);

    // Auto-hide toast after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration);
    }
  }, [generateId]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    hideAllToasts,
  };

  // Set global reference for non-React contexts
  useEffect(() => {
    setGlobalToastRef(value);
    return () => setGlobalToastRef(null);
  }, [value]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <ToastManager toasts={toasts} onHide={hideToast} />
      </Portal>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}