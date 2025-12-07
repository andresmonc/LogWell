/**
 * Mock for expo-barcode-scanner on web
 * This library is native-only and not available on web
 */

export const BarCodeScanner = null;

export const requestPermissionsAsync = async () => {
  return { status: 'denied' };
};

export default {
  BarCodeScanner,
  requestPermissionsAsync,
};

