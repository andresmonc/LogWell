import React from 'react';
import { View, StyleSheet, Pressable, ViewProps } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onDuplicate?: () => void;
}

// Extended props for web - mouse events are supported in react-native-web
interface WebViewProps extends ViewProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const WebView = View as React.ComponentType<WebViewProps>;

/**
 * Web version of SwipeableRow - uses hover-reveal buttons instead of swipe
 * since gesture handling on web is less intuitive
 */
export function SwipeableRow({ children, onDelete, onDuplicate }: SwipeableRowProps) {
  const theme = useTheme();
  const [showActions, setShowActions] = React.useState(false);

  return (
    <WebView 
      style={styles.container}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {children}
      {showActions && (
        <View style={styles.actionsOverlay}>
          {onDuplicate && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={onDuplicate}
            >
              <IconButton icon="content-copy" iconColor="white" size={18} />
              <Text style={styles.actionText}>Copy</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            onPress={onDelete}
          >
            <IconButton icon="delete" iconColor="white" size={18} />
            <Text style={styles.actionText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </WebView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actionsOverlay: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -20 }],
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default SwipeableRow;
