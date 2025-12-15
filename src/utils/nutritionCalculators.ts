import { NutritionInfo, FoodEntry, NutritionGoals } from '../types/nutrition';

/**
 * Calculate nutrition values for a food entry based on quantity
 */
export function calculateEntryNutrition(entry: FoodEntry): NutritionInfo {
  if (!entry || !entry.food || !entry.food.nutritionPerServing) {
    console.warn('Invalid food entry provided to calculateEntryNutrition');
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
  }

  const { food, quantity } = entry;
  
  // Ensure quantity is a valid number
  const multiplier = typeof quantity === 'number' && quantity > 0 ? quantity : 0;
  
  return {
    calories: (food.nutritionPerServing.calories || 0) * multiplier,
    protein: (food.nutritionPerServing.protein || 0) * multiplier,
    carbs: (food.nutritionPerServing.carbs || 0) * multiplier,
    fat: (food.nutritionPerServing.fat || 0) * multiplier,
    fiber: (food.nutritionPerServing.fiber || 0) * multiplier,
    sugar: (food.nutritionPerServing.sugar || 0) * multiplier,
    sodium: (food.nutritionPerServing.sodium || 0) * multiplier,
  };
}

/**
 * Calculate total nutrition from multiple food entries
 */
export function calculateTotalNutrition(entries: FoodEntry[]): NutritionInfo {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
  }

  return entries
    .filter(entry => entry && entry.food) // Filter out invalid entries
    .reduce(
      (total: NutritionInfo, entry: FoodEntry): NutritionInfo => {
        const entryNutrition = calculateEntryNutrition(entry);
        
        return {
          calories: total.calories + entryNutrition.calories,
          protein: total.protein + entryNutrition.protein,
          carbs: total.carbs + entryNutrition.carbs,
          fat: total.fat + entryNutrition.fat,
          fiber: (total.fiber || 0) + (entryNutrition.fiber || 0),
          sugar: (total.sugar || 0) + (entryNutrition.sugar || 0),
          sodium: (total.sodium || 0) + (entryNutrition.sodium || 0),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 } as NutritionInfo
    );
}

/**
 * Calculate progress percentage for a nutrition value against its goal
 */
export function calculateProgress(current: number, goal: number): number {
  if (typeof current !== 'number' || typeof goal !== 'number' || goal <= 0) {
    return 0;
  }
  return Math.min((current / goal) * 100, 100);
}

/**
 * Calculate remaining nutrition to reach goals
 */
export function calculateRemaining(current: NutritionInfo, goals: NutritionGoals) {
  return {
    calories: Math.max(0, goals.calories - current.calories),
    protein: Math.max(0, goals.protein - current.protein),
    carbs: Math.max(0, goals.carbs - current.carbs),
    fat: Math.max(0, goals.fat - current.fat),
  };
}

/**
 * Calculate macro distribution percentages
 */
export function calculateMacroDistribution(nutrition: NutritionInfo) {
  const proteinCalories = nutrition.protein * 4;
  const carbCalories = nutrition.carbs * 4;
  const fatCalories = nutrition.fat * 9;
  const totalCalories = nutrition.calories;

  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: (proteinCalories / totalCalories) * 100,
    carbs: (carbCalories / totalCalories) * 100,
    fat: (fatCalories / totalCalories) * 100,
  };
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: 'male' | 'female'
): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active'
): number {
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly-active': 1.375,
    'moderately-active': 1.55,
    'very-active': 1.725,
    'extremely-active': 1.9,
  };

  return bmr * activityMultipliers[activityLevel];
}

/**
 * Suggest macro distribution based on goals
 */
export function suggestMacroDistribution(calories: number, type: 'balanced' | 'high-protein' | 'low-carb' | 'body-recomposition') {
  switch (type) {
    case 'body-recomposition':
      // Optimized for body recomposition: higher protein, balanced carbs/fats
      // Research shows: 30-35% protein, 30-35% carbs, 20-30% fat
      return {
        protein: Math.round((calories * 0.33) / 4), // 33% protein (within 30-35% range)
        carbs: Math.round((calories * 0.33) / 4),   // 33% carbs (within 30-35% range)
        fat: Math.round((calories * 0.34) / 9),     // 34% fat (within 30-40% range, supports hormone production)
      };
    case 'high-protein':
      return {
        protein: Math.round((calories * 0.30) / 4), // 30% protein
        carbs: Math.round((calories * 0.40) / 4),   // 40% carbs
        fat: Math.round((calories * 0.30) / 9),     // 30% fat
      };
    case 'low-carb':
      return {
        protein: Math.round((calories * 0.25) / 4), // 25% protein
        carbs: Math.round((calories * 0.20) / 4),   // 20% carbs
        fat: Math.round((calories * 0.55) / 9),     // 55% fat
      };
    case 'balanced':
    default:
      return {
        protein: Math.round((calories * 0.20) / 4), // 20% protein
        carbs: Math.round((calories * 0.50) / 4),   // 50% carbs
        fat: Math.round((calories * 0.30) / 9),     // 30% fat
      };
  }
}

/**
 * Calculate nutrition goals from TDEE
 * Uses a balanced macro distribution by default
 */
export function calculateGoalsFromTDEE(
  tdee: number,
  macroType: 'balanced' | 'high-protein' | 'low-carb' = 'balanced',
  goalType: 'maintenance' | 'weight-loss' | 'weight-gain' | 'body-recomposition' = 'maintenance'
): NutritionGoals {
  // Adjust calories based on goal type
  let targetCalories = tdee;
  let finalMacroType = macroType;
  
  if (goalType === 'weight-loss') {
    // 500 calorie deficit for ~1 lb/week weight loss
    targetCalories = Math.max(1200, tdee - 500);
  } else if (goalType === 'weight-gain') {
    // 500 calorie surplus for ~1 lb/week weight gain
    targetCalories = tdee + 500;
  } else if (goalType === 'body-recomposition') {
    // Smaller deficit (10-15% of TDEE, typically 250-375 calories) to support muscle growth while losing fat
    // Research shows 10-20% deficit is optimal for body recomposition
    // Using ~10% deficit (250 cal) for better muscle preservation
    const deficitPercent = 0.10; // 10% deficit
    const deficit = Math.round(tdee * deficitPercent);
    targetCalories = Math.max(1400, tdee - deficit);
    // Body recomposition uses specific macro ratios optimized for muscle preservation/growth
    finalMacroType = 'body-recomposition';
  }

  // Calculate macros based on distribution type
  const macros = suggestMacroDistribution(targetCalories, finalMacroType);

  return {
    calories: Math.round(targetCalories),
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    fiber: 25, // Default fiber goal
  };
}

/**
 * Check if nutrition goals are being met
 */
export function checkGoalProgress(current: NutritionInfo, goals: NutritionGoals) {
  return {
    calories: {
      current: current.calories,
      goal: goals.calories,
      percentage: calculateProgress(current.calories, goals.calories),
      status: current.calories >= goals.calories * 0.9 ? 'on-track' : 'under',
    },
    protein: {
      current: current.protein,
      goal: goals.protein,
      percentage: calculateProgress(current.protein, goals.protein),
      status: current.protein >= goals.protein * 0.9 ? 'on-track' : 'under',
    },
    carbs: {
      current: current.carbs,
      goal: goals.carbs,
      percentage: calculateProgress(current.carbs, goals.carbs),
      status: current.carbs >= goals.carbs * 0.9 ? 'on-track' : 'under',
    },
    fat: {
      current: current.fat,
      goal: goals.fat,
      percentage: calculateProgress(current.fat, goals.fat),
      status: current.fat >= goals.fat * 0.9 ? 'on-track' : 'under',
    },
  };
}