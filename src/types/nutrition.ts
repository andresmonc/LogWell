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
  isRecipe?: boolean; // Flag to identify if this is a custom recipe
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  foodId: string;
  food: Food;
  quantity: number; // number of servings
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number; // number of servings this recipe makes
  nutritionPerServing: NutritionInfo; // calculated from ingredients
  instructions?: string;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  category?: FoodCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortionPreset {
  label: string;
  multiplier: number;
}

export const PORTION_PRESETS: PortionPreset[] = [
  { label: '0.25x', multiplier: 0.25 },
  { label: '0.5x', multiplier: 0.5 },
  { label: '0.75x', multiplier: 0.75 },
  { label: '1x (serving)', multiplier: 1 },
  { label: '1.5x', multiplier: 1.5 },
  { label: '2x', multiplier: 2 },
  { label: '3x', multiplier: 3 },
];

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
}

export interface UserProfile {
  id: string;
  name?: string;
  age?: number;
  gender?: 'male' | 'female';
  height?: number; // cm (stored internally)
  weight?: number; // kg (stored internally)
  activityLevel?: ActivityLevel;
  unitSystem?: 'imperial' | 'metric'; // display preference, defaults to 'imperial'
  goals: NutritionGoals;
  goalsSource?: 'default' | 'manual' | 'calculated'; // Track how goals were set
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