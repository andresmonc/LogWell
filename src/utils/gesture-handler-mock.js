import React from 'react';
import { View, Pressable } from 'react-native';

// Mock GestureHandlerRootView for web - just renders children
export const GestureHandlerRootView = ({ children, style }) => (
  <View style={style}>{children}</View>
);

// Mock Swipeable for web - just renders children
export class Swipeable extends React.Component {
  close() {}
  render() {
    return this.props.children;
  }
}

// Mock RectButton for web - use Pressable
export const RectButton = ({ children, onPress, style }) => (
  <Pressable style={style} onPress={onPress}>{children}</Pressable>
);

// Re-export View as other gesture components
export const PanGestureHandler = View;
export const TapGestureHandler = View;
export const ScrollView = View;
export const FlatList = View;
export const BaseButton = Pressable;
export const BorderlessButton = Pressable;

// Default export for `import Swipeable from 'react-native-gesture-handler/Swipeable'`
export default Swipeable;

export const Directions = {};
export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};
