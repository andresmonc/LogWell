/**
 * LogWell - Local Nutrition Tracking App
 * A privacy-focused nutrition tracking app that stores all data locally on your device
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppProvider from './src/providers/AppProvider';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
