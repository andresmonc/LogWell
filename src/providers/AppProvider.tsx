import React from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import type { AppProviderProps } from '../types/components';

// Custom theme based on Material Design 3
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(103, 80, 164)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(234, 221, 255)',
    onPrimaryContainer: 'rgb(33, 0, 93)',
    secondary: 'rgb(102, 90, 111)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(237, 221, 246)',
    onSecondaryContainer: 'rgb(33, 24, 42)',
    tertiary: 'rgb(128, 81, 88)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(255, 217, 221)',
    onTertiaryContainer: 'rgb(50, 16, 23)',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(206, 193, 255)',
    onPrimary: 'rgb(54, 26, 118)',
    primaryContainer: 'rgb(78, 52, 140)',
    onPrimaryContainer: 'rgb(234, 221, 255)',
    secondary: 'rgb(208, 193, 218)',
    onSecondary: 'rgb(54, 44, 63)',
    secondaryContainer: 'rgb(77, 67, 87)',
    onSecondaryContainer: 'rgb(237, 221, 246)',
    tertiary: 'rgb(225, 189, 195)',
    onTertiary: 'rgb(73, 37, 44)',
    tertiaryContainer: 'rgb(99, 59, 65)',
    onTertiaryContainer: 'rgb(255, 217, 221)',
  },
};

export default function AppProvider({ children }: AppProviderProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      {children}
    </PaperProvider>
  );
}