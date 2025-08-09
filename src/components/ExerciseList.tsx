import React from 'react';
import { ScrollView, View, StyleProp, ViewStyle } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { sharedStyles } from '../utils/sharedStyles';

export interface ExerciseListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyTitle?: string;
  emptyIcon?: string; // material-community icon name
  footer?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
}

export function ExerciseList<T>({
  items,
  keyExtractor,
  renderItem,
  emptyTitle = 'Add exercises to get started',
  emptyIcon = 'dumbbell',
  footer,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: ExerciseListProps<T>) {
  const theme = useTheme();

  return (
    <ScrollView
      style={sharedStyles.scrollView}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {items.length === 0 ? (
        <View style={sharedStyles.emptyState}>
          <IconButton
            icon={emptyIcon}
            size={60}
            iconColor={theme.colors.primary}
            style={sharedStyles.emptyIcon}
          />
          <Text
            variant="bodyLarge"
            style={[sharedStyles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {emptyTitle}
          </Text>
        </View>
      ) : (
        items.map((item, index) => (
          <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>
        ))
      )}

      {footer}
    </ScrollView>
  );
}

export default ExerciseList;


