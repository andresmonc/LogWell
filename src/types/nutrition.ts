export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutritionPerServing: NutritionInfo;
  servingDescription: string; // e.g., "1 slice", "1 burger", "100g"
  category?: FoodCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodEntry {
  id: string;
  foodId: string;
  food: Food;
  quantity: number; // number of servings
  mealType: MealType;
  loggedAt: Date;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD format
  entries: FoodEntry[];
  totalNutrition: NutritionInfo;
  waterIntake?: number; // ml
  notes?: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  water?: number; // ml
}

export interface UserProfile {
  id: string;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: ActivityLevel;
  goals: NutritionGoals;
  dashboardMacros?: DashboardMacroPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMacroPreferences {
  showProtein: boolean;
  showCarbs: boolean;
  showFat: boolean;
  showFiber: boolean;
  showSugar: boolean;
  showSodium: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'proteins'
  | 'dairy'
  | 'fats'
  | 'beverages'
  | 'snacks'
  | 'prepared-foods'
  | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly-active'
  | 'moderately-active'
  | 'very-active'
  | 'extremely-active';

// UI Types
export interface NutritionProgress {
  current: number;
  goal: number;
  percentage: number;
}

export interface DayNutritionSummary {
  date: string;
  totalCalories: NutritionProgress;
  totalProtein: NutritionProgress;
  totalCarbs: NutritionProgress;
  totalFat: NutritionProgress;
  mealBreakdown: {
    [key in MealType]: NutritionInfo;
  };
}