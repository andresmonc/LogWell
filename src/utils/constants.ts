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

// AI Configuration (OpenRouter)
export const AI_CONFIG = {
  MAX_TOKENS: 500,
  TEMPERATURE: 0.3,
  DEFAULT_MODEL: 'openai/gpt-4o-mini',
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  SITE_URL: 'https://logwell.app',
  SITE_NAME: 'LogWell',
} as const;

// Available AI Models (OpenRouter)
export const AI_MODELS = [
  // OpenRouter special routing options
  { id: 'openrouter/auto', name: 'Auto (Best)', description: 'Auto-selects best model', provider: 'OpenRouter' },
  { id: 'openrouter/auto:free', name: 'Auto (Free)', description: 'Free tier, auto-select', provider: 'OpenRouter' },
  // Premium models
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & affordable', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Most capable', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Great for analysis', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast & efficient', provider: 'Anthropic' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', description: 'Multimodal', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Open source', provider: 'Meta' },
  // Free models
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', description: 'Free, lightweight', provider: 'Meta' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', description: 'Free, by Google', provider: 'Google' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', description: 'Free, fast', provider: 'Mistral' },
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];

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
  RECIPES: '@LogWell:recipes',
  DAILY_LOGS: '@LogWell:daily_logs',
  USER_PROFILE: '@LogWell:user_profile',
  SETTINGS: '@LogWell:settings',
  AI_API_KEY: '@LogWell:ai_api_key',
  AI_MODEL: '@LogWell:ai_model',
  // Legacy key for migration
  CHATGPT_API_KEY_LEGACY: '@LogWell:chatgpt_api_key',
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