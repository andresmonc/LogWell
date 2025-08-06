import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Portal } from 'react-native-paper';
import { ToastManager } from '../components/ToastManager';
import { setGlobalToastRef } from '../utils/toastUtils';
import { generateId } from '../utils/idGenerator';
import { TOAST_DEFAULTS } from '../utils/constants';
import type { Toast, ToastConfig, ToastContextValue } from '../types/toast';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = useCallback((config: ToastConfig) => {
    const id = generateId();
    const toast: Toast = {
      id,
      ...config,
      duration: config.duration ?? TOAST_DEFAULTS.DURATION,
    };

    setToasts(prev => [...prev, toast]);

    // Auto-hide toast after duration with proper cleanup
    if (toast.duration && toast.duration > 0) {
      const timeoutId = setTimeout(() => {
        hideToast(id);
        timeoutRefs.current.delete(id);
      }, toast.duration);
      
      timeoutRefs.current.set(id, timeoutId);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    
    // Clear timeout if it exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

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