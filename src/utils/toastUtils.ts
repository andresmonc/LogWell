/**
 * Toast utilities for non-React contexts and compatibility
 * These functions can be used from anywhere in the app
 */

// Global toast reference - will be set by the ToastProvider
let globalToastRef: any = null;

export const setGlobalToastRef = (ref: any) => {
  globalToastRef = ref;
};

// Fallback toast functions for use outside React context
export const showToastSuccess = (message: string, duration?: number) => {
  if (globalToastRef) {
    globalToastRef.showSuccess(message, duration);
  } else {
    console.warn('Toast system not initialized');
  }
};

export const showToastError = (message: string, duration?: number) => {
  if (globalToastRef) {
    globalToastRef.showError(message, duration);
  } else {
    console.warn('Toast system not initialized');
  }
};

export const showToastWarning = (message: string, duration?: number) => {
  if (globalToastRef) {
    globalToastRef.showWarning(message, duration);
  } else {
    console.warn('Toast system not initialized');
  }
};

export const showToastInfo = (message: string, duration?: number) => {
  if (globalToastRef) {
    globalToastRef.showInfo(message, duration);
  } else {
    console.warn('Toast system not initialized');
  }
};