import { StyleSheet } from 'react-native';

/**
 * Shared styles for common UI patterns across the app
 * Use these to maintain consistency and reduce duplication
 */
export const sharedStyles = StyleSheet.create({
  // Container patterns
  container: {
    flex: 1,
  },
  containerWithPadding: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Card spacing patterns
  cardSpacing: {
    marginBottom: 16,
  },
  smallCardSpacing: {
    marginBottom: 8,
  },
  largeCardSpacing: {
    marginBottom: 24,
  },

  // Text styles
  textSecondary: {
    opacity: 0.7,
  },
  textTertiary: {
    opacity: 0.6,
  },
  textMuted: {
    opacity: 0.5,
  },
  textBold: {
    fontWeight: 'bold',
  },
  textSemiBold: {
    fontWeight: '600',
  },
  textMedium: {
    fontWeight: '500',
  },
  textCenter: {
    textAlign: 'center',
  },

  // Common flexbox layouts
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flexDirection: 'column',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },

  // Button patterns
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: 8,
  },

  // Modal patterns
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalButton: {
    marginTop: 16,
  },

  // Common spacing
  marginTopSmall: {
    marginTop: 8,
  },
  marginTopMedium: {
    marginTop: 12,
  },
  marginTopLarge: {
    marginTop: 16,
  },
  marginBottomSmall: {
    marginBottom: 8,
  },
  marginBottomMedium: {
    marginBottom: 12,
  },
  marginBottomLarge: {
    marginBottom: 16,
  },

  // Shadow patterns
  shadowSmall: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  shadowMedium: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  shadowLarge: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Empty state patterns
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.5,
    lineHeight: 20,
  },

  // Section patterns
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  // Input patterns
  input: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInput: {
    flex: 1,
  },
  
  // Section patterns
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  
  // Button group patterns
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  segmentedButtons: {
    marginBottom: 16,
  },

  // Brand text pattern
  brandText: {
    opacity: 0.7,
    marginBottom: 4,
    fontStyle: 'italic',
  },

  // Progress bar pattern
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
});

/**
 * Spacing constants for consistent spacing throughout the app
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Border radius constants
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 20,
} as const;

/**
 * Common font sizes
 */
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
} as const;