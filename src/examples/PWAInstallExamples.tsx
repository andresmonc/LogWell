/**
 * PWA Install Examples
 * 
 * This file demonstrates how to use the PWA install system in different scenarios.
 * The system follows UX best practices by showing prompts only after meaningful user interaction.
 * 
 * IMPORTANT: PWA install only works on web platform. The system automatically detects
 * the platform and will not show prompts on native iOS/Android.
 * 
 * Key principles:
 * - Never show the prompt immediately on page load
 * - Wait for user to demonstrate value from the app (logged in, completed action, etc.)
 * - Prompt is shown at most once per user (dismissal persists)
 * - Gracefully handles all browsers including iOS Safari
 * - Respects users who have already installed the app
 * - Only activates on web platform (React Native Web)
 */

import React, { useEffect } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { usePWAInstallContext } from '../providers/PWAInstallProvider';

/**
 * EXAMPLE 1: Show prompt after user logs in
 * 
 * This is a good UX pattern - the user has demonstrated interest
 * by logging in, making it appropriate to suggest installation.
 */
export const LoginScreenExample = () => {
  const { showPrompt, canInstall } = usePWAInstallContext();

  const handleLogin = async (username: string, password: string) => {
    // ... perform login logic
    const loginSuccessful = true; // example

    if (loginSuccessful && canInstall) {
      // Show the install prompt after successful login
      // Use a small delay to let the user see the success state first
      setTimeout(() => {
        showPrompt();
      }, 1500);
    }
  };

  return <View>{/* Your login UI */}</View>;
};

/**
 * EXAMPLE 2: Show prompt after user completes a workout
 * 
 * After the user has used a core feature, they understand the value
 * and are more likely to want quick access via installation.
 */
export const WorkoutCompleteExample = () => {
  const { showPrompt, canInstall } = usePWAInstallContext();

  const handleWorkoutComplete = () => {
    // ... save workout data
    
    if (canInstall) {
      // Show congratulations message first, then install prompt
      setTimeout(() => {
        showPrompt();
      }, 2000);
    }
  };

  return <View>{/* Your workout UI */}</View>;
};

/**
 * EXAMPLE 3: Show prompt after N visits
 * 
 * Track user visits and show prompt after they've visited multiple times,
 * indicating they're getting value from the app.
 */
export const DashboardWithVisitTracking = () => {
  const { showPrompt, canInstall } = usePWAInstallContext();

  useEffect(() => {
    // Track visits in localStorage
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0', 10);
    const newVisitCount = visitCount + 1;
    localStorage.setItem('visit-count', newVisitCount.toString());

    // Show prompt after 3 visits
    if (newVisitCount === 3 && canInstall) {
      setTimeout(() => {
        showPrompt();
      }, 3000); // Wait 3 seconds after page load
    }
  }, [canInstall, showPrompt]);

  return <View>{/* Your dashboard UI */}</View>;
};

/**
 * EXAMPLE 4: Manual install button in settings
 * 
 * Always provide a way for users to manually install if they dismissed
 * the prompt but later change their mind.
 */
export const SettingsScreenExample = () => {
  const { showPrompt, canInstall, isInstalled } = usePWAInstallContext();

  return (
    <View>
      <Text>Settings</Text>
      
      {/* Only show button if not installed and installation is possible */}
      {!isInstalled && canInstall && (
        <Button 
          title="Install App" 
          onPress={showPrompt}
        />
      )}

      {isInstalled && (
        <Text>✓ App is installed</Text>
      )}
    </View>
  );
};

/**
 * EXAMPLE 5: Conditional rendering based on install state
 * 
 * Show different UI depending on whether the app is installed,
 * can be installed, or doesn't support installation.
 * Note: This will only show on web platform.
 */
export const HomeScreenExample = () => {
  const { 
    isInstalled, 
    canInstall, 
    isIOS,
    showPrompt 
  } = usePWAInstallContext();

  // Only show PWA-specific UI on web
  if (Platform.OS !== 'web') {
    return (
      <View>
        <Text>Welcome to LogWell!</Text>
      </View>
    );
  }

  if (isInstalled) {
    return (
      <View>
        <Text>Welcome back! You're using the installed app.</Text>
      </View>
    );
  }

  if (canInstall) {
    return (
      <View>
        <Text>
          {isIOS 
            ? 'For the best experience, add this app to your home screen!'
            : 'Get quick access by installing the app!'}
        </Text>
        <Button title="Learn How" onPress={showPrompt} />
      </View>
    );
  }

  // Default: installation not supported or already dismissed
  return (
    <View>
      <Text>Welcome to LogWell!</Text>
    </View>
  );
};

/**
 * EXAMPLE 6: Check install state without context (utility function)
 * 
 * Sometimes you need to check install state outside of React components.
 * Import the hook directly for this use case.
 */
export const checkInstallStateExample = () => {
  // This would be in a non-React context
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) {
    console.log('App is installed!');
    // Track analytics, adjust UI, etc.
  }
};

/**
 * EXAMPLE 7: Reset dismissal state (for testing)
 * 
 * During development, you may want to test the prompt again.
 * Run this in the browser console to reset the dismissal state.
 */
export const resetPWADismissal = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pwa-install-dismissed');
    console.log('PWA dismissal state cleared. Reload to see prompt again.');
  }
};

/**
 * RECOMMENDED TIMING PATTERNS:
 * 
 * GOOD ✓
 * - After user logs in
 * - After user completes a core action (workout, meal logged, etc.)
 * - After 2-3 visits indicating engagement
 * - In settings menu for manual installation
 * - After user has been on site for 2-3 minutes
 * 
 * BAD ✗
 * - Immediately on page load
 * - Before user has interacted with the app
 * - Multiple times per session
 * - While user is in the middle of a task
 * - Without any user interaction
 * 
 * REMEMBER:
 * - The prompt can only be shown once per user (unless they clear storage)
 * - iOS Safari requires manual installation, can't trigger native prompt
 * - Prompt is not available if user has already installed the app
 * - Always provide a manual install option in settings
 */

/**
 * BROWSER SUPPORT NOTES:
 * 
 * Chrome/Edge (Desktop & Android):
 * - Supports beforeinstallprompt event
 * - Can trigger native install prompt
 * - Shows banner with app icon and install button
 * 
 * Safari (iOS):
 * - Does NOT support beforeinstallprompt
 * - Requires manual installation via Share menu
 * - System shows custom instructions: "Tap Share → Add to Home Screen"
 * 
 * Safari (macOS):
 * - Limited PWA support
 * - Requires manual installation via File menu
 * - Detection works, but installation is manual
 * 
 * Firefox:
 * - Supports PWAs but installation is through browser menu
 * - beforeinstallprompt support varies
 * - System gracefully falls back to iOS-style instructions if needed
 */
