import React from 'react';
import { Text } from 'react-native-paper';
import { calculateEntryNutrition } from '../utils/nutritionCalculators';
import type { FoodEntry } from '../types/nutrition';

interface NutritionDisplayProps {
  entry: FoodEntry;
  showProtein?: boolean;
  variant?: 'bodyMedium' | 'bodyLarge' | 'bodySmall';
}

export default function NutritionDisplay({ 
  entry, 
  showProtein = true, 
  variant = 'bodyMedium' 
}: NutritionDisplayProps) {
  const nutrition = calculateEntryNutrition(entry);
  
  return (
    <Text variant={variant}>
      {entry.quantity} {entry.quantityUnit} • {Math.round(nutrition.calories)} cal
      {showProtein && ` • ${Math.round(nutrition.protein)}g protein`}
    </Text>
  );
}