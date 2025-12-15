/**
 * PWAInstallPrompt Component
 * 
 * Minimal, non-intrusive UI for PWA installation
 * Handles both standard browsers and iOS Safari with custom instructions
 * 
 * Features:
 * - Slide-up banner from bottom of screen
 * - Different UI for iOS Safari (manual instructions)
 * - Dismissible with "X" button
 * - Clean, accessible design
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import WebIcon from './WebIcon';

interface PWAInstallPromptProps {
  // Whether this is iOS Safari (shows different UI)
  isIOS: boolean;
  // Callback to trigger the install prompt (standard browsers)
  onInstall: () => void;
  // Callback when user dismisses the prompt
  onDismiss: () => void;
  // Optional custom styling
  style?: any;
}

/**
 * PWA Install Prompt Component
 * 
 * Shows a non-intrusive banner at the bottom of the screen
 * prompting users to install the PWA.
 * 
 * For standard browsers: Shows "Install" button that triggers native prompt
 * For iOS Safari: Shows instructions for manual installation
 */
const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  isIOS,
  onInstall,
  onDismiss,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Close button */}
        <TouchableOpacity 
          onPress={onDismiss}
          style={styles.closeButton}
          accessibilityLabel="Dismiss install prompt"
          accessibilityRole="button"
        >
          {Platform.OS === 'web' ? (
            <WebIcon name="close" size={20} color="#666" />
          ) : (
            <Text style={styles.closeIcon}>✕</Text>
          )}
        </TouchableOpacity>

        {/* App icon and text */}
        <View style={styles.textContainer}>
          {isIOS ? (
            // iOS Safari: Show manual installation instructions
            <>
              <Text style={styles.title}>Install LogWell</Text>
              <View style={styles.iosInstructions}>
                <Text style={styles.description}>
                  Tap{' '}
                  {Platform.OS === 'web' ? (
                    <WebIcon name="export-variant" size={16} color="#666" />
                  ) : (
                    <Text style={styles.shareIcon}>⬆️</Text>
                  )}
                  {' '}Share, then "Add to Home Screen"
                </Text>
              </View>
            </>
          ) : (
            // Standard browsers: Show install button
            <>
              <Text style={styles.title}>Install LogWell</Text>
              <Text style={styles.description}>
                Get quick access and a better experience
              </Text>
            </>
          )}
        </View>

        {/* Install button (only for non-iOS) */}
        {!isIOS && (
          <Button
            mode="contained"
            onPress={onInstall}
            style={styles.installButton}
            labelStyle={styles.buttonLabel}
            accessibilityLabel="Install app"
          >
            Install
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'web' ? 12 : 24, // Extra padding for mobile safe area
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 4,
    marginRight: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  iosInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  shareIcon: {
    fontSize: 16,
  },
  installButton: {
    borderRadius: 8,
    minWidth: 90,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PWAInstallPrompt;
