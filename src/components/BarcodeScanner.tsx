/**
 * Barcode Scanner Component
 * Platform-specific implementation for scanning barcodes/UPCs
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import type { BarcodeScannerProps } from '../types/components';

// Platform-specific imports
let PermissionsAndroid: any = null;
if (Platform.OS === 'android') {
  PermissionsAndroid = require('react-native').PermissionsAndroid;
}

// Platform-specific imports - only load on native platforms
let BarCodeScanner: any = null;
let requestPermissionsAsync: any = null;

if (Platform.OS !== 'web') {
  // Native implementation - only import on native platforms
  try {
    const expoBarcodeScanner = require('expo-barcode-scanner');
    BarCodeScanner = expoBarcodeScanner.BarCodeScanner;
    requestPermissionsAsync = expoBarcodeScanner.requestPermissionsAsync;
  } catch (e) {
    console.warn('expo-barcode-scanner not available:', e);
  }
}

export default function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const theme = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<any>(null); // HTMLVideoElement for web
  const containerRef = useRef<any>(null); // HTMLDivElement for web
  const streamRef = useRef<any>(null); // MediaStream for web
  const barcodeDetectorRef = useRef<any>(null); // BarcodeDetector for web

  useEffect(() => {
    if (Platform.OS === 'web') {
      initializeWebScanner();
    } else {
      requestCameraPermission();
    }

    return () => {
      // Cleanup
      if (Platform.OS === 'web' && streamRef.current) {
        try {
          (streamRef.current as any).getTracks().forEach((track: any) => track.stop());
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Use useEffect to attach video element to DOM (web only)
  // This must be at the top level, not conditionally called
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // @ts-ignore - document is not available in React Native types
    const globalDocument: any = typeof document !== 'undefined' ? document : null;
    if (hasPermission && streamRef.current && containerRef.current && !videoRef.current && globalDocument) {
      const video = globalDocument.createElement('video');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      
      (containerRef.current as any).appendChild(video);
      videoRef.current = video;
      video.srcObject = streamRef.current;
      video.play();
    }
    
    return () => {
      if (Platform.OS === 'web' && videoRef.current && (videoRef.current as any).parentNode) {
        (videoRef.current as any).parentNode.removeChild(videoRef.current);
        videoRef.current = null;
      }
    };
  }, [hasPermission]);

  const initializeWebScanner = async () => {
    try {
      // Check if BarcodeDetector API is available (Chrome/Edge only)
      // @ts-ignore - window is not available in React Native types
      const globalWindow: any = typeof window !== 'undefined' ? window : null;
      if (globalWindow && 'BarcodeDetector' in globalWindow) {
        try {
          // @ts-ignore - BarcodeDetector is not in TypeScript types yet
          const BarcodeDetector = globalWindow.BarcodeDetector;
          barcodeDetectorRef.current = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'qr_code']
          });
        } catch (e) {
          console.warn('BarcodeDetector initialization failed:', e);
        }
      } else {
        // Fallback to ZXing for iOS Safari/PWA and other browsers
        try {
          const { BrowserMultiFormatReader } = require('@zxing/browser');
          barcodeDetectorRef.current = new BrowserMultiFormatReader();
        } catch (e) {
          console.warn('ZXing library not available:', e);
        }
      }

      // Request camera access
      // @ts-ignore - navigator is not available in React Native types
      const globalNavigator: any = typeof navigator !== 'undefined' ? navigator : null;
      if (!globalNavigator || !globalNavigator.mediaDevices) {
        throw new Error('MediaDevices API not available');
      }
      const stream = await globalNavigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      setIsScanning(true);
      setHasPermission(true);

      // Video element will be attached in useEffect
      // Start scanning loop after a short delay to ensure video is playing
      setTimeout(() => {
        scanBarcodeLoop();
      }, 1000);
    } catch (error) {
      console.error('Error initializing web scanner:', error);
      setHasPermission(false);
    }
  };

  const scanBarcodeLoop = async () => {
    if (!videoRef.current || !isScanning) {
      return;
    }

    // If BarcodeDetector is available (Chrome/Edge), use it
    if (barcodeDetectorRef.current) {
      try {
        // Check if it's BarcodeDetector API or ZXing
        const isBarcodeDetector = typeof barcodeDetectorRef.current.detect === 'function';
        
        if (isBarcodeDetector) {
          // Use BarcodeDetector API
          const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
          
          if (barcodes && barcodes.length > 0) {
            const barcode = barcodes[0];
            const code = barcode.rawValue;
            
            if (code) {
              // Stop scanning and return the barcode
              setIsScanning(false);
              if (streamRef.current) {
                try {
                  (streamRef.current as any).getTracks().forEach((track: any) => track.stop());
                } catch (e) {
                  // Ignore cleanup errors
                }
              }
              onScan(code);
              return;
            }
          }
        }
        // ZXing is handled separately in useEffect after video is ready
      } catch (error) {
        console.warn('Barcode detection error:', error);
      }
    }

    // Continue scanning (only for BarcodeDetector API)
    if (isScanning && videoRef.current && barcodeDetectorRef.current) {
      const isBarcodeDetector = typeof barcodeDetectorRef.current.detect === 'function';
      if (isBarcodeDetector) {
        setTimeout(() => scanBarcodeLoop(), 100); // Check every 100ms for BarcodeDetector
      }
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android' && PermissionsAndroid) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'LogWell needs access to your camera to scan barcodes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
        setHasPermission(false);
      }
    } else if (Platform.OS !== 'web') {
      // iOS - expo-barcode-scanner handles permissions
      if (requestPermissionsAsync) {
        const { status } = await requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } else {
        setHasPermission(false);
      }
    } else {
      // Web - permissions handled in initializeWebScanner
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data) {
      setIsScanning(false);
      onScan(data);
    }
  };

  // Use useEffect to attach video element to DOM and start ZXing scanning (web only)
  // This must be called before any conditional returns
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // @ts-ignore - document is not available in React Native types
    const globalDocument: any = typeof document !== 'undefined' ? document : null;
    if (hasPermission && streamRef.current && containerRef.current && !videoRef.current && globalDocument) {
      const video = globalDocument.createElement('video');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      
      (containerRef.current as any).appendChild(video);
      videoRef.current = video;
      video.srcObject = streamRef.current;
      
      video.onloadedmetadata = () => {
        video.play().then(() => {
          // Check if we're using ZXing (not BarcodeDetector)
          if (barcodeDetectorRef.current && typeof barcodeDetectorRef.current.decodeFromVideoDevice === 'function') {
            // Start ZXing scanning (for iOS Safari/PWA)
            try {
              barcodeDetectorRef.current.decodeFromVideoDevice(
                null,
                video,
                (result: any, error: any) => {
                  if (result) {
                    const code = result.getText();
                    if (code) {
                      // Stop scanning and return the barcode
                      setIsScanning(false);
                      if (streamRef.current) {
                        try {
                          (streamRef.current as any).getTracks().forEach((track: any) => track.stop());
                        } catch (e) {
                          // Ignore cleanup errors
                        }
                      }
                      // Stop ZXing scanning
                      barcodeDetectorRef.current.reset();
                      onScan(code);
                    }
                  } else if (error && error.name !== 'NotFoundException') {
                    // NotFoundException is normal - means no barcode found yet
                    console.warn('ZXing scan error:', error);
                  }
                }
              );
            } catch (error) {
              console.warn('ZXing decode error:', error);
            }
          }
        });
      };
    }
    
    return () => {
      if (Platform.OS === 'web') {
        // Stop ZXing if it's running
        if (barcodeDetectorRef.current && typeof barcodeDetectorRef.current.reset === 'function') {
          try {
            barcodeDetectorRef.current.reset();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
        if (videoRef.current && (videoRef.current as any).parentNode) {
          (videoRef.current as any).parentNode.removeChild(videoRef.current);
          videoRef.current = null;
        }
      }
    };
  }, [hasPermission]);

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.message, { color: theme.colors.onSurface }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.message, { color: theme.colors.error }]}>
          Camera permission is required to scan barcodes
        </Text>
        <Button mode="contained" onPress={Platform.OS === 'web' ? initializeWebScanner : requestCameraPermission} style={styles.button}>
          Grant Permission
        </Button>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
      </View>
    );
  }

  if (Platform.OS === 'web') {

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.videoContainer}>
          {/* @ts-ignore - Using native HTML div for video container */}
          <div 
            ref={containerRef}
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 8
            }} 
          />
          <View style={[styles.overlay, { borderColor: theme.colors.primary }]}>
            <View style={[styles.scanArea, { borderColor: theme.colors.primary }]} />
          </View>
        </View>
        <Text style={[styles.instruction, { color: theme.colors.onSurface }]}>
          {barcodeDetectorRef.current 
            ? 'Position the barcode within the frame'
            : 'Barcode scanner not available. Please use a supported browser or enter barcode manually.'}
        </Text>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
      </View>
    );
  }

  // Native implementation
  if (!BarCodeScanner) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.message, { color: theme.colors.error }]}>
          Barcode scanner not available
        </Text>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <BarCodeScanner
        onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[
          BarCodeScanner.Constants.BarCodeType.ean13,
          BarCodeScanner.Constants.BarCodeType.ean8,
          BarCodeScanner.Constants.BarCodeType.upc_a,
          BarCodeScanner.Constants.BarCodeType.upc_e,
          BarCodeScanner.Constants.BarCodeType.code128,
          BarCodeScanner.Constants.BarCodeType.code39,
          BarCodeScanner.Constants.BarCodeType.code93,
          BarCodeScanner.Constants.BarCodeType.codabar,
        ]}
      />
      <View style={[styles.overlay, { borderColor: theme.colors.primary }]}>
        <View style={[styles.scanArea, { borderColor: theme.colors.primary }]} />
      </View>
      <Text style={[styles.instruction, { color: theme.colors.onSurface }]}>
        Position the barcode within the frame
      </Text>
      <Button mode="outlined" onPress={onCancel} style={styles.button}>
        Cancel
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoContainer: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: '80%',
    height: '40%',
    borderWidth: 2,
    borderRadius: 8,
  },
  instruction: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    minWidth: 200,
  },
});

