/**
 * PWAInstallProvider
 * 
 * Context provider that makes PWA install functionality available throughout the app
 * Manages the display logic and ensures the prompt is shown at appropriate times
 * 
 * Usage:
 * ```tsx
 * // In App.tsx or AppProvider
 * <PWAInstallProvider>
 *   <YourApp />
 * </PWAInstallProvider>
 * 
 * // In any component
 * const { showPrompt, canInstall } = usePWAInstallContext();
 * 
 * // Show after meaningful interaction
 * if (userJustLoggedIn && canInstall) {
 *   showPrompt();
 * }
 * ```
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { usePWAInstall } from '../hooks/usePWAInstall';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

interface PWAInstallContextValue {
  // Whether the prompt can be shown
  canInstall: boolean;
  // Whether the app is already installed
  isInstalled: boolean;
  // Whether this is iOS Safari
  isIOS: boolean;
  // Function to show the install prompt UI
  showPrompt: () => void;
  // Function to hide the install prompt UI
  hidePrompt: () => void;
  // Whether the prompt UI is currently visible
  isPromptVisible: boolean;
}

const PWAInstallContext = createContext<PWAInstallContextValue | undefined>(undefined);

interface PWAInstallProviderProps {
  children: ReactNode;
  // Optional: Auto-show prompt after a delay (not recommended for UX)
  autoShowDelay?: number;
}

/**
 * Provider component that manages PWA install prompt state
 * and renders the prompt UI when appropriate
 */
export const PWAInstallProvider: React.FC<PWAInstallProviderProps> = ({
  children,
  autoShowDelay,
}) => {
  const {
    canInstall,
    isInstalled,
    isIOS,
    promptInstall,
    dismissPrompt,
  } = usePWAInstall();

  // Track whether the UI prompt is visible
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  /**
   * Shows the install prompt UI
   * Call this after meaningful user interaction
   */
  const showPrompt = useCallback(() => {
    if (canInstall) {
      setIsPromptVisible(true);
    }
  }, [canInstall]);

  /**
   * Hides the install prompt UI without dismissing permanently
   */
  const hidePrompt = useCallback(() => {
    setIsPromptVisible(false);
  }, []);

  /**
   * Handles the install action
   * For standard browsers: triggers native prompt
   * For iOS: the UI already shows instructions
   */
  const handleInstall = useCallback(async () => {
    if (!isIOS) {
      await promptInstall();
      setIsPromptVisible(false);
    }
  }, [isIOS, promptInstall]);

  /**
   * Handles dismissing the prompt permanently
   */
  const handleDismiss = useCallback(() => {
    dismissPrompt();
    setIsPromptVisible(false);
  }, [dismissPrompt]);

  // Optional: Auto-show after delay (not recommended, but available)
  React.useEffect(() => {
    if (autoShowDelay && canInstall) {
      const timer = setTimeout(() => {
        showPrompt();
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }
  }, [autoShowDelay, canInstall, showPrompt]);

  const contextValue: PWAInstallContextValue = {
    canInstall,
    isInstalled,
    isIOS,
    showPrompt,
    hidePrompt,
    isPromptVisible,
  };

  return (
    <PWAInstallContext.Provider value={contextValue}>
      {children}
      
      {/* Render the prompt UI when visible (web only) */}
      {Platform.OS === 'web' && isPromptVisible && canInstall && (
        <PWAInstallPrompt
          isIOS={isIOS}
          onInstall={handleInstall}
          onDismiss={handleDismiss}
        />
      )}
    </PWAInstallContext.Provider>
  );
};

/**
 * Hook to access PWA install context
 * Must be used within PWAInstallProvider
 */
export const usePWAInstallContext = (): PWAInstallContextValue => {
  const context = useContext(PWAInstallContext);
  
  if (context === undefined) {
    throw new Error('usePWAInstallContext must be used within PWAInstallProvider');
  }
  
  return context;
};
