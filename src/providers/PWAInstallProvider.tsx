/**
 * PWAInstallProvider
 * 
 * Shows PWA install prompt once on web, never again if dismissed
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePWAInstall } from '../hooks/usePWAInstall';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

interface PWAInstallProviderProps {
  children: React.ReactNode;
}

export const PWAInstallProvider: React.FC<PWAInstallProviderProps> = ({ children }) => {
  const {
    canInstall,
    isIOS,
    promptInstall,
    dismissPrompt,
  } = usePWAInstall();

  const handleInstall = async () => {
    if (!isIOS) {
      await promptInstall();
    }
  };

  return (
    <>
      {children}
      
      {/* Show prompt once on web, never again if dismissed */}
      {Platform.OS === 'web' && canInstall && (
        <PWAInstallPrompt
          isIOS={isIOS}
          onInstall={handleInstall}
          onDismiss={dismissPrompt}
        />
      )}
    </>
  );
};
