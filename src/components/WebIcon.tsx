/**
 * Web-specific icon component using Material Design Icons CDN
 * Only used on web platform - native apps use @expo/vector-icons
 */
import React from 'react';
import { Platform } from 'react-native';

// Icon name mapping from MaterialCommunityIcons to MDI class names
const getIconClass = (name: string): string => {
  const normalizedName = name.replace(/_/g, '-').toLowerCase();
  
  // Map common icon names from MaterialIcons and MaterialCommunityIcons to MDI class names
  const iconMap: Record<string, string> = {
    // Navigation icons
    'chevron-left': 'mdi-chevron-left',
    'chevron-right': 'mdi-chevron-right',
    'chevron-up': 'mdi-chevron-up',
    'chevron-down': 'mdi-chevron-down',
    // MaterialIcons (used in bottom nav) - Google Material Icons names
    'dashboard': 'mdi-view-dashboard',
    'restaurant': 'mdi-silverware-fork-knife',
    'fitness-center': 'mdi-dumbbell',
    'person': 'mdi-account',
    'help': 'mdi-help-circle',
    // MaterialCommunityIcons (used in react-native-paper)
    'robot-outline': 'mdi-robot-outline',
    'key': 'mdi-key',
    'camera': 'mdi-camera',
    'dumbbell': 'mdi-dumbbell',
    'plus': 'mdi-plus',
    'magnify': 'mdi-magnify',
    'search': 'mdi-magnify',
    'qrcode-scan': 'mdi-qrcode-scan',
    'food-off': 'mdi-food-off',
  };
  
  // Check if we have a direct mapping
  if (iconMap[normalizedName]) {
    return iconMap[normalizedName];
  }
  
  // Fallback: try mdi-{name} (MDI often uses the same names)
  return `mdi-${normalizedName}`;
};

interface WebIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function WebIcon({ name, size = 24, color = '#000000', style }: WebIconProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  const iconClass = getIconClass(name);
  
  // Use React.createElement to create a web-native span element
  // React Native Web will handle this properly
  return React.createElement('span', {
    className: `mdi ${iconClass}`,
    style: {
      fontSize: `${size}px`,
      color: color,
      fontFamily: 'Material Design Icons',
      display: 'inline-block',
      width: `${size}px`,
      height: `${size}px`,
      lineHeight: `${size}px`,
      textAlign: 'center',
      ...style,
    },
  });
}

