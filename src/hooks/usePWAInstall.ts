/**
 * usePWAInstall Hook
 * 
 * Production-quality PWA install prompt manager.
 * Handles beforeinstallprompt event, iOS Safari detection, and install state persistence.
 * 
 * Features:
 * - Captures beforeinstallprompt without immediate trigger
 * - Detects iOS Safari for custom install instructions
 * - Persists dismissal state in localStorage (shown once per user)
 * - Detects if app is already installed
 * - Gracefully handles unsupported browsers
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  // Whether the prompt can be shown (event captured and not dismissed)
  canInstall: boolean;
  // Whether the app is already installed
  isInstalled: boolean;
  // Whether this is iOS Safari (requires custom instructions)
  isIOS: boolean;
  // Whether the browser supports PWA installation
  isSupported: boolean;
  // Whether the user has dismissed the prompt
  isDismissed: boolean;
  // Function to trigger the install prompt
  promptInstall: () => Promise<void>;
  // Function to dismiss the prompt (persists to localStorage)
  dismissPrompt: () => void;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

/**
 * Detects if the browser is iOS Safari
 * iOS Safari doesn't support beforeinstallprompt, requires manual instructions
 */
const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
  
  // Return true only if it's iOS and NOT already installed
  return isIOS && !isInStandaloneMode;
};

/**
 * Detects if the app is already installed/running in standalone mode
 */
const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (PWA installed)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Checks if the user has previously dismissed the install prompt
 */
const hasUserDismissed = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(DISMISSED_KEY) === 'true';
};

/**
 * Main PWA install hook
 * 
 * Usage:
 * ```tsx
 * const { canInstall, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
 * 
 * // Show prompt after meaningful interaction
 * if (canInstall && userIsLoggedIn) {
 *   <PWAInstallPrompt onInstall={promptInstall} onDismiss={dismissPrompt} />
 * }
 * ```
 */
export const usePWAInstall = (): PWAInstallState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(hasUserDismissed());
  const [isInstalled] = useState<boolean>(isAppInstalled());
  const [isIOS] = useState<boolean>(isIOSSafari());

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') return;
    
    // Don't set up listeners if app is already installed or on server
    if (typeof window === 'undefined' || isInstalled) return;

    /**
     * Capture the beforeinstallprompt event
     * This event is fired when the browser determines the app can be installed
     * We prevent default to control when the prompt is shown
     */
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      console.log('[PWA] Install prompt event captured');
    };

    /**
     * Listen for successful app installation
     * Clean up state after installation
     */
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed');
      setDeferredPrompt(null);
      
      // Optional: Track installation analytics here
      // analytics.track('pwa_installed');
    };

    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  /**
   * Triggers the native PWA install prompt
   * Should be called in response to user interaction
   */
  const promptInstall = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User response: ${outcome}`);
      
      if (outcome === 'dismissed') {
        // User dismissed, mark as dismissed
        dismissPrompt();
      }
      
      // Clear the deferredPrompt for garbage collection
      setDeferredPrompt(null);
      
      // Optional: Track user choice
      // analytics.track('pwa_prompt_response', { outcome });
      
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }
  }, [deferredPrompt]);

  /**
   * Dismisses the install prompt and persists the choice
   * User won't see the prompt again
   */
  const dismissPrompt = useCallback((): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, 'true');
    }
    setIsDismissed(true);
    
    console.log('[PWA] Install prompt dismissed by user');
    
    // Optional: Track dismissal
    // analytics.track('pwa_prompt_dismissed');
  }, []);

  /**
   * Determine if we can show the install prompt
   * Conditions:
   * - Not already installed
   * - Not dismissed by user
   * - Either has deferred prompt (standard) OR is iOS Safari
   */
  const canInstall = !isInstalled && !isDismissed && (!!deferredPrompt || isIOS);

  /**
   * Determine if PWA installation is supported
   * Either standard beforeinstallprompt or iOS manual install
   */
  const isSupported = !!deferredPrompt || isIOS;

  return {
    canInstall,
    isInstalled,
    isIOS,
    isSupported,
    isDismissed,
    promptInstall,
    dismissPrompt,
  };
};
