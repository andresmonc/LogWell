/**
 * API and service-related types
 */

import type { AIModelId } from '../utils/constants';

export interface NutritionAnalysisRequest {
  description?: string;
  imageBase64?: string;
  apiKey: string;
  model?: AIModelId;
}

export interface NutritionAnalysisResponse {
  name: string;
  brand?: string;
  servingSize: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  confidence: number;
  reasoning?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
}