/**
 * Mock for expo-font on web
 * Since we use CDN fonts for icons on web, we can always return true for font loading
 */

export const loadAsync = () => Promise.resolve();

export const isLoaded = () => true;

export const isLoading = () => false;

export default {
  loadAsync,
  isLoaded,
  isLoading,
};

