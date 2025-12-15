/**
 * Application constants to replace hardcoded magic numbers and strings
 */

// Toast Configuration
export const TOAST_DEFAULTS = {
  DURATION: 4000, // 4 seconds
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000,
} as const;

// OpenAI Configuration  
export const OPENAI_CONFIG = {
  MAX_TOKENS: 500,
  TEMPERATURE: 0.3,
  MODEL: 'gpt-4o-mini',
} as const;

// Workout Configuration
export const WORKOUT_CONFIG = {
  AUTO_SAVE_DELAY: 1000, // 1 second
  SET_COUNT_FALLBACK_DELAY: 100, // 100ms
  TIMER_INTERVAL: 1000, // 1 second
} as const;

// Nutrition Defaults
export const NUTRITION_DEFAULTS = {
  DAILY_SODIUM_GOAL: 2300, // mg
  DEFAULT_FIBER_GOAL: 25, // g
  DEFAULT_SUGAR_GOAL: 50, // g
  GOAL_THRESHOLD: 0.9, // 90% of goal considered "on-track"
} as const;

// Pagination
export const PAGINATION = {
  EXERCISE_PAGE_SIZE: 20,
  FOOD_PAGE_SIZE: 15,
} as const;

// Storage Keys (centralized)
export const STORAGE_KEYS = {
  FOODS: '@LogWell:foods',
  DAILY_LOGS: '@LogWell:daily_logs',
  USER_PROFILE: '@LogWell:user_profile',
  SETTINGS: '@LogWell:settings',
  CHATGPT_API_KEY: '@LogWell:chatgpt_api_key',
  WORKOUT_SESSIONS: '@LogWell:workout_sessions',
  WORKOUT_ROUTINES: '@LogWell:workout_routines',
  NAVIGATION_STATE: '@LogWell:navigation_state',
} as const;

// Macro Calories per Gram
export const MACRO_CALORIES = {
  PROTEIN: 4,
  CARBS: 4,
  FAT: 9,
} as const;

// Activity Level Multipliers for TDEE
export const ACTIVITY_MULTIPLIERS = {
  'sedentary': 1.2,
  'lightly-active': 1.375,
  'moderately-active': 1.55,
  'very-active': 1.725,
  'extremely-active': 1.9,
} as const;

// ID Generation
export const ID_CONFIG = {
  ENTROPY_LENGTH: 8, // Additional entropy characters
} as const;

// Colors
export const COLORS = {
  // Macro colors
  FAT: '#FF9800',
  FIBER: '#4CAF50',
  SUGAR: '#E91E63',
  SODIUM: '#9C27B0',
  
  // Status colors
  SUCCESS: '#4CAF50',
  ERROR: '#FF3B30',
  WARNING: '#f57c00',
  
  // UI colors
  GRAY_LIGHT: '#E0E0E0',
  GRAY_MEDIUM: '#9E9E9E',
  GRAY_DARK: '#000',
  WHITE: '#fff',
  BACKGROUND_LIGHT: '#F5F5F5',
  BLUE_LIGHT: '#E3F2FD',
  BLUE_MEDIUM: '#1976D2',
  PRIMARY_PURPLE: '#6200EE',
  
  // Shadow
  SHADOW: '#000',
} as const;