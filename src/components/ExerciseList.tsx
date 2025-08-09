import React, { useMemo } from 'react';
import { ScrollView, View, StyleProp, ViewStyle } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { sharedStyles } from '../utils/sharedStyles';

export interface ExerciseListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (
    item: T,
    index: number,
    helpers: { startDrag?: () => void; isActive?: boolean }
  ) => React.ReactNode;
  emptyTitle?: string;
  emptyIcon?: string; // material-community icon name
  footer?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  onReorder?: (newItems: T[]) => void;
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
  onReorder,
}: ExerciseListProps<T>) {
  const theme = useTheme();

  const EmptyComponent = useMemo(() => (
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
  ), [emptyIcon, emptyTitle, theme.colors.onSurfaceVariant, theme.colors.primary]);

  if (!onReorder) {
    return (
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {items.length === 0 ? (
          EmptyComponent
        ) : (
          items.map((item, index) => (
            <View key={keyExtractor(item, index)}>
              {renderItem(item, index, { startDrag: undefined, isActive: false })}
            </View>
          ))
        )}

        {footer}
      </ScrollView>
    );
  }

  // Draggable list path
  let DraggableFlatList: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DraggableFlatList = require('react-native-draggable-flatlist').default;
  } catch (e) {
    // Fallback to non-draggable if package isn't installed
    return (
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {items.length === 0 ? (
          EmptyComponent
        ) : (
          items.map((item, index) => (
            <View key={keyExtractor(item, index)}>
              {renderItem(item, index, { startDrag: undefined, isActive: false })}
            </View>
          ))
        )}
        {footer}
      </ScrollView>
    );
  }

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={keyExtractor as any}
      contentContainerStyle={contentContainerStyle}
      ListEmptyComponent={EmptyComponent}
      ListFooterComponent={footer as any}
      renderItem={({ item, index, drag, isActive }: any) => (
        <View>{renderItem(item, index, { startDrag: drag, isActive })}</View>
      )}
      onDragEnd={({ data }: any) => onReorder?.(data)}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    />
  );
}

export default ExerciseList;


