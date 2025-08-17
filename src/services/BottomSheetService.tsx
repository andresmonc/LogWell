import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

const { height: screenHeight } = Dimensions.get('window');

interface BottomSheetConfig {
  id: string;
  content: React.ReactNode;
  height?: number; // percentage of screen height, default 35%
}

interface BottomSheetContextType {
  showBottomSheet: (config: BottomSheetConfig) => void;
  hideBottomSheet: (id: string) => void;
  hideAllBottomSheets: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined);

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [bottomSheets, setBottomSheets] = useState<BottomSheetConfig[]>([]);
  const translateYRefs = useRef<Map<string, Animated.Value>>(new Map());

  const showBottomSheet = (config: BottomSheetConfig) => {
    // Create animated value for this bottom sheet
    const translateY = new Animated.Value(screenHeight);
    translateYRefs.current.set(config.id, translateY);

    setBottomSheets(prev => [...prev, config]);

    // Animate in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideBottomSheet = (id: string) => {
    const translateY = translateYRefs.current.get(id);
    if (translateY) {
      // Animate out
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Remove from state after animation completes
        setBottomSheets(prev => prev.filter(sheet => sheet.id !== id));
        translateYRefs.current.delete(id);
      });
    }
  };

  const hideAllBottomSheets = () => {
    bottomSheets.forEach(sheet => hideBottomSheet(sheet.id));
  };

  return (
    <BottomSheetContext.Provider value={{ showBottomSheet, hideBottomSheet, hideAllBottomSheets }}>
      {children}
      
      {/* Render all active bottom sheets */}
      {bottomSheets.map((sheet) => (
        <BottomSheet
          key={sheet.id}
          id={sheet.id}
          content={sheet.content}
          height={sheet.height}
          translateY={translateYRefs.current.get(sheet.id)!}
          onClose={() => hideBottomSheet(sheet.id)}
        />
      ))}
    </BottomSheetContext.Provider>
  );
}

interface BottomSheetProps {
  id: string;
  content: React.ReactNode;
  height?: number;
  translateY: Animated.Value;
  onClose: () => void;
}

function BottomSheet({ id, content, height = 35, translateY, onClose }: BottomSheetProps) {
  const theme = useTheme();

  if (!translateY) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: theme.colors.surface,
                height: screenHeight * (height / 100),
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Drag Indicator */}
            <View style={styles.dragIndicator}>
              <View style={[styles.dragBar, { backgroundColor: theme.colors.onSurfaceVariant }]} />
            </View>
            
            {/* Content */}
            <View style={styles.content}>
              {content}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dragIndicator: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});

// Hook to use the bottom sheet service
export function useBottomSheet() {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
}
