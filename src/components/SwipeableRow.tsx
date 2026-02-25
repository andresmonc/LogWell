import React, { useRef } from 'react';
import { View, StyleSheet, Animated, I18nManager } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { warningHaptic } from '../utils/haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export function SwipeableRow({ children, onDelete, onDuplicate }: SwipeableRowProps) {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => {
    swipeableRef.current?.close();
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-160, -80, 0],
      outputRange: [0, 40, 80],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionsContainer}>
        {onDuplicate && (
          <Animated.View style={[styles.actionContainer, { transform: [{ translateX }, { scale }], opacity }]}>
            <RectButton
              style={[styles.rightAction, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                close();
                onDuplicate();
              }}
            >
              <IconButton icon="content-copy" iconColor="white" size={20} />
              <Text style={styles.actionText}>Copy</Text>
            </RectButton>
          </Animated.View>
        )}
        <Animated.View style={[styles.actionContainer, { transform: [{ translateX }, { scale }], opacity }]}>
          <RectButton
            style={[styles.rightAction, { backgroundColor: theme.colors.error }]}
            onPress={() => {
              warningHaptic();
              close();
              onDelete();
            }}
          >
            <IconButton icon="delete" iconColor="white" size={20} />
            <Text style={styles.actionText}>Delete</Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => warningHaptic()}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContainer: {
    marginVertical: 4,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginLeft: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -8,
  },
});

export default SwipeableRow;
