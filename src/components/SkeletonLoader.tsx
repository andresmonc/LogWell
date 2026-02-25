import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton loader for food list items - matches the List.Item layout
 */
export function FoodItemSkeleton() {
  return (
    <View style={styles.foodItemContainer}>
      <View style={styles.foodItemContent}>
        <Skeleton width="70%" height={18} style={styles.titleSkeleton} />
        <Skeleton width="50%" height={14} style={styles.subtitleSkeleton} />
        <Skeleton width="30%" height={12} />
      </View>
      <View style={styles.foodItemActions}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <Skeleton width={36} height={36} borderRadius={18} style={styles.actionSkeleton} />
      </View>
    </View>
  );
}

/**
 * Skeleton loader for search results - shows multiple food item skeletons
 */
export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardSkeleton}>
          <FoodItemSkeleton />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton loader for horizontal chip list (quick access)
 */
export function QuickAccessSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.quickAccessContainer}>
      <Skeleton width={100} height={18} style={styles.sectionTitleSkeleton} />
      <View style={styles.chipContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton 
            key={index} 
            width={120} 
            height={50} 
            borderRadius={12} 
            style={styles.chipSkeleton}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foodItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  foodItemContent: {
    flex: 1,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  subtitleSkeleton: {
    marginBottom: 6,
  },
  foodItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionSkeleton: {
    marginLeft: 8,
  },
  cardSkeleton: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickAccessContainer: {
    marginBottom: 16,
  },
  sectionTitleSkeleton: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chipSkeleton: {
    marginRight: 8,
  },
});

export default Skeleton;
