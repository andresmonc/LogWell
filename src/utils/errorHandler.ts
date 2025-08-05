import { showError } from './alertUtils';

/**
 * Centralized error handling utilities to reduce duplication and improve consistency
 */

export interface ErrorHandlerOptions {
  /** Custom error message to show to user */
  userMessage?: string;
  /** Whether to show alert to user (default: true) */
  showAlert?: boolean;
  /** Whether to log error to console (default: true) */
  logError?: boolean;
  /** Custom context for error logging */
  context?: string;
}

/**
 * Handle errors consistently across the app
 */
export const handleError = (
  error: unknown,
  defaultMessage: string,
  options: ErrorHandlerOptions = {}
) => {
  const {
    userMessage = defaultMessage,
    showAlert = true,
    logError = true,
    context = ''
  } = options;

  // Log error if enabled
  if (logError) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    console.error(logMessage, error);
  }

  // Show alert if enabled
  if (showAlert) {
    showError(userMessage);
  }
};

/**
 * Handle async operations with consistent error handling
 */
export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  options: ErrorHandlerOptions = {}
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, errorMessage, options);
    return null;
  }
};

/**
 * Common error messages for consistency
 */
export const ErrorMessages = {
  LOAD_DATA: 'Failed to load data. Please try again.',
  SAVE_DATA: 'Failed to save data. Please try again.',
  DELETE_DATA: 'Failed to delete item. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC: 'Something went wrong. Please try again.',
} as const;