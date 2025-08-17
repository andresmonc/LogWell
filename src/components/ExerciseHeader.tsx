import React, { useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextInput as RNTextInput } from 'react-native';
import { Title, Text, IconButton, Menu, useTheme } from 'react-native-paper';
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
  // Notes field always shown
  notesValue?: string;
  notesPlaceholder?: string;
  notesEditable?: boolean;
  onNotesChange: (text: string) => void;
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
      
      {/* Inline Notes - Always shown */}
      <View style={styles.notesContainer}>
        <RNTextInput
          placeholder={notesPlaceholder}
          value={notesValue}
          onChangeText={onNotesChange}
          style={[sharedStyles.notesInput, { 
            backgroundColor: 'white',
            height: 40,
            minHeight: 40,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
            padding: 8
          }]}
          multiline
          numberOfLines={1}
          editable={notesEditable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
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
    width: '100%',
    marginTop: spacing.sm,
  },
});

export default ExerciseHeader;


