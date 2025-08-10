import React, { useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Title, Text, IconButton, Menu, TextInput, useTheme } from 'react-native-paper';
import { sharedStyles, spacing } from '../utils/sharedStyles';

export interface ExerciseHeaderMenuItem {
  title: string;
  icon?: string;
  onPress: () => void;
}

export interface ExerciseHeaderProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode; // e.g., exercise image/avatar
  menuItems?: ExerciseHeaderMenuItem[];
  showOptions?: boolean;
  optionsIcon?: string;
  containerStyle?: StyleProp<ViewStyle>;
  optionsButtonStyle?: StyleProp<ViewStyle>;
  // Optional notes field bundled into header
  showNotes?: boolean;
  notesValue?: string;
  notesPlaceholder?: string;
  notesEditable?: boolean;
  onNotesChange?: (text: string) => void;
}

export function ExerciseHeader({
  title,
  subtitle,
  left,
  menuItems = [],
  showOptions = true,
  optionsIcon = 'dots-vertical',
  containerStyle,
  optionsButtonStyle,
  showNotes = false,
  notesValue = '',
  notesPlaceholder = 'Add notes here...',
  notesEditable = true,
  onNotesChange,
}: ExerciseHeaderProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const hasMenu = showOptions && menuItems.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={sharedStyles.rowCenter}>
        {left ? <View style={sharedStyles.imageContainer}>{left}</View> : null}
        <View style={styles.textContainer}>
          <Title style={sharedStyles.listItemTitle}>{title}</Title>
          {subtitle ? (
            <Text style={[sharedStyles.listItemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {hasMenu ? (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon={optionsIcon}
              size={20}
              onPress={() => setMenuVisible(true)}
              style={[styles.optionsButton, optionsButtonStyle]}
            />
          }
        >
          {menuItems.map((item, idx) => (
            <Menu.Item
              key={`${item.title}-${idx}`}
              onPress={() => {
                setMenuVisible(false);
                item.onPress();
              }}
              title={item.title}
              leadingIcon={item.icon}
            />
          ))}
        </Menu>
      ) : null}
      
      {/* Inline Notes */}
      {showNotes ? (
        <View style={styles.notesContainer}>
          <TextInput
            placeholder={notesPlaceholder}
            value={notesValue}
            onChangeText={onNotesChange}
            style={sharedStyles.notesInput}
            mode="flat"
            multiline
            numberOfLines={1}
            underlineStyle={{ height: 0 }}
            editable={notesEditable}
            contentStyle={{ backgroundColor: 'transparent', paddingVertical: 8 }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...sharedStyles.rowBetween,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  optionsButton: {
    margin: 0,
    marginTop: -8,
    marginRight: -12,
  },
  notesContainer: {
    flexBasis: '100%',
    marginTop: spacing.sm,
  },
});

export default ExerciseHeader;


