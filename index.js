/**
 * @format
 */

import { Platform } from 'react-native';

// Only import gesture-handler on native platforms
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
