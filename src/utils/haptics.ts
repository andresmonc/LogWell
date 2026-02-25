import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for enhancing UX
 * Falls back gracefully on unsupported platforms (web)
 */

const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light haptic feedback for subtle interactions
 * Use for: toggles, selections, tab changes
 */
export const lightHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

/**
 * Medium haptic feedback for standard interactions
 * Use for: button presses, adding items
 */
export const mediumHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
};

/**
 * Heavy haptic feedback for significant actions
 * Use for: deleting items, completing major tasks
 */
export const heavyHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }
};

/**
 * Success haptic feedback
 * Use for: successful operations, confirmations
 */
export const successHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
};

/**
 * Warning haptic feedback
 * Use for: warnings, confirmations needed
 */
export const warningHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }
};

/**
 * Error haptic feedback
 * Use for: errors, failed operations
 */
export const errorHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
};

/**
 * Selection haptic feedback
 * Use for: picker selection, swipe actions
 */
export const selectionHaptic = () => {
  if (isHapticsSupported) {
    Haptics.selectionAsync().catch(() => {});
  }
};
