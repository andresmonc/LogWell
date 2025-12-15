import type { MealType } from '../types/nutrition';

export interface MealTypeVisualConfig {
  icon: string;
  color: string;
  emoji: string;
}

export const MEAL_TYPE_CONFIG: Record<MealType, MealTypeVisualConfig> = {
  breakfast: {
    icon: 'weather-sunset-up',
    color: '#FFA726', // Orange
    emoji: '🌅'
  },
  lunch: {
    icon: 'weather-sunny',
    color: '#66BB6A', // Green
    emoji: '☀️'
  },
  dinner: {
    icon: 'weather-night',
    color: '#FF7043', // Deep Orange
    emoji: '🌙'
  },
  snack: {
    icon: 'cookie',
    color: '#AB47BC', // Purple
    emoji: '🍪'
  }
};

export function getMealTypeIcon(mealType: MealType): string {
  return MEAL_TYPE_CONFIG[mealType].icon;
}

export function getMealTypeColor(mealType: MealType): string {
  return MEAL_TYPE_CONFIG[mealType].color;
}

export function getMealTypeEmoji(mealType: MealType): string {
  return MEAL_TYPE_CONFIG[mealType].emoji;
}

export function getMealTypeLabel(mealType: MealType): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}
