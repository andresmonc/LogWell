/**
 * Web entry point for LogWell
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import appConfig from './app.json';

const appName = appConfig.name;

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Render to DOM using AppRegistry (React Native Web compatible)
const rootTag = document.getElementById('root');
if (rootTag) {
  AppRegistry.runApplication(appName, {
    initialProps: {},
    rootTag,
  });
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator && !__DEV__) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

