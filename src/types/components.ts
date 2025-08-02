/**
 * Component prop types and interfaces
 */

import { ReactNode } from 'react';
import { NutritionInfo } from './nutrition';

// Date navigation component
export interface DateNavigationCardProps {
  selectedDate: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

// Nutrition display component
export interface NutritionDisplayProps {
  entry: import('./nutrition').FoodEntry;
  showProtein?: boolean;
  variant?: 'bodyMedium' | 'bodyLarge' | 'bodySmall';
}

// AI Food Analyzer component
export interface AIFoodAnalyzerProps {
  apiKey: string | null;
  onAnalysisComplete: (result: {
    name: string;
    brand?: string;
    servingSize: string;
    nutrition: import('./nutrition').NutritionInfo;
    confidence: number;
    reasoning?: string;
  }, originalInput: { description: string; image: string | null }) => void;
  onRequestApiKey: () => void;
  isModal?: boolean;
  initialDescription?: string;
  initialImage?: string | null;
}

// App provider component
export interface AppProviderProps {
  children: ReactNode;
}

// Generic component props
export interface BaseComponentProps {
  children?: ReactNode;
  style?: any;
  testID?: string;
}