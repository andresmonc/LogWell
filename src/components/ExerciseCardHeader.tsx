import React from 'react';
import { View } from 'react-native';
import { Title, IconButton, Menu } from 'react-native-paper';
import { sharedStyles } from '../utils/sharedStyles';

interface ExerciseCardHeaderProps {
  exerciseName: string;
  renderImage: React.ReactNode;
  menuVisible: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onDelete?: () => void;
  onReorderStart?: () => void;
}

export default function ExerciseCardHeader({
  exerciseName,
  renderImage,
  menuVisible,
  onOpenMenu,
  onCloseMenu,
  onDelete,
  onReorderStart,
}: ExerciseCardHeaderProps) {
  return (
    <View style={sharedStyles.listItemContent}>
      <View style={sharedStyles.imageContainer}>{renderImage}</View>
      <Title style={[sharedStyles.listItemTitle, { flex: 1 }]}>{exerciseName}</Title>
      <Menu
        visible={menuVisible}
        onDismiss={onCloseMenu}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={onOpenMenu}
            style={{ marginLeft: -8 }}
          />
        }
      >
        {onReorderStart && (
          <Menu.Item title="Reorder Exercise" leadingIcon="drag-vertical" onPress={onReorderStart} />
        )}
        {onDelete && (
          <Menu.Item title="Delete Exercise" leadingIcon="delete" onPress={onDelete} />
        )}
      </Menu>
    </View>
  );
}


