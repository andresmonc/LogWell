/**
 * Mock for expo-font on web
 * expo-font is not needed for web as we can use web fonts directly
 */

export const loadAsync = () => Promise.resolve();
export const isLoaded = () => true;
export const isLoading = () => false;

export default {
  loadAsync,
  isLoaded,
  isLoading,
};

