// Mock for expo-haptics on web - no-op functions since web doesn't support haptic feedback

export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium', 
  Heavy: 'heavy',
  Soft: 'soft',
  Rigid: 'rigid',
};

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
};

// All haptic functions are no-ops on web
export async function impactAsync(style = ImpactFeedbackStyle.Medium) {
  // No-op on web
}

export async function notificationAsync(type = NotificationFeedbackType.Success) {
  // No-op on web
}

export async function selectionAsync() {
  // No-op on web
}

export default {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  selectionAsync,
};
