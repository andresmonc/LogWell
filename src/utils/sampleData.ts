import { Food, UserProfile, NutritionGoals } from '../types/nutrition';

/**
 * Sample foods for testing and initial app experience
 */
export const sampleFoods: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Chicken Breast',
    brand: 'Generic',
    nutritionPerServing: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sodium: 74,
    },
    servingDescription: '100g',
    category: 'proteins',
  },
  {
    name: 'Brown Rice',
    brand: 'Generic',
    nutritionPerServing: {
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      fiber: 3.5,
      sodium: 2,
    },
    servingDescription: '1 cup cooked',
    category: 'grains',
  },
  {
    name: 'Salmon Fillet',
    nutritionPerServing: {
      calories: 312,
      protein: 37,
      carbs: 0,
      fat: 18,
      fiber: 0,
      sodium: 89,
    },
    servingDescription: '150g fillet',
    category: 'proteins',
  },
  {
    name: 'Avocado',
    nutritionPerServing: {
      calories: 234,
      protein: 3,
      carbs: 12,
      fat: 21,
      fiber: 10,
      sodium: 7,
    },
    servingDescription: '1 medium avocado',
    category: 'fats',
  },
  {
    name: 'Greek Yogurt',
    brand: 'Generic',
    nutritionPerServing: {
      calories: 130,
      protein: 15,
      carbs: 9,
      fat: 5,
      fiber: 0,
      sodium: 50,
    },
    servingDescription: '1 cup',
    category: 'dairy',
  },
  {
    name: 'Banana',
    nutritionPerServing: {
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3.1,
      sodium: 1,
    },
    servingDescription: '1 medium banana',
    category: 'fruits',
  },
  {
    name: 'Almonds',
    nutritionPerServing: {
      calories: 161,
      protein: 6,
      carbs: 6,
      fat: 14,
      fiber: 3.5,
      sodium: 0,
    },
    servingDescription: '1 oz (23 almonds)',
    category: 'fats',
  },
  {
    name: 'Sweet Potato',
    nutritionPerServing: {
      calories: 112,
      protein: 2,
      carbs: 26,
      fat: 0.1,
      fiber: 3.8,
      sodium: 7,
    },
    servingDescription: '1 medium potato',
    category: 'vegetables',
  },
  {
    name: 'Broccoli',
    nutritionPerServing: {
      calories: 25,
      protein: 3,
      carbs: 5,
      fat: 0.3,
      fiber: 2.3,
      sodium: 33,
    },
    servingDescription: '1 cup chopped',
    category: 'vegetables',
  },
  {
    name: 'Whole Wheat Bread',
    brand: 'Generic',
    nutritionPerServing: {
      calories: 81,
      protein: 4,
      carbs: 14,
      fat: 1.1,
      fiber: 2,
      sodium: 144,
    },
    servingDescription: '1 slice',
    category: 'grains',
  },
];

/**
 * Default user profile for new users
 */
export const defaultUserProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'New User',
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
    fiber: 25,
    water: 2000,
  },
};

/**
 * Common nutrition goal presets
 */
export const nutritionGoalPresets: { [key: string]: NutritionGoals } = {
  'Weight Loss': {
    calories: 1500,
    protein: 120,
    carbs: 150,
    fat: 50,
    fiber: 25,
    water: 2500,
  },
  'Muscle Gain': {
    calories: 2500,
    protein: 200,
    carbs: 300,
    fat: 83,
    fiber: 35,
    water: 3000,
  },
  'Maintenance': {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
    fiber: 25,
    water: 2000,
  },
  'High Protein': {
    calories: 2000,
    protein: 180,
    carbs: 200,
    fat: 67,
    fiber: 25,
    water: 2200,
  },
  'Low Carb': {
    calories: 2000,
    protein: 150,
    carbs: 100,
    fat: 111,
    fiber: 20,
    water: 2200,
  },
};

/**
 * Activity level multipliers for TDEE calculation
 */
export const activityLevelData = {
  'sedentary': {
    label: 'Sedentary',
    description: 'Little to no exercise',
    multiplier: 1.2,
  },
  'lightly-active': {
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    multiplier: 1.375,
  },
  'moderately-active': {
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    multiplier: 1.55,
  },
  'very-active': {
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    multiplier: 1.725,
  },
  'extremely-active': {
    label: 'Extremely Active',
    description: 'Very hard exercise, physical job',
    multiplier: 1.9,
  },
};

/**
 * Common food categories for easy filtering
 */
export const foodCategories = [
  { value: 'fruits', label: 'Fruits', icon: '🍎' },
  { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { value: 'grains', label: 'Grains', icon: '🌾' },
  { value: 'proteins', label: 'Proteins', icon: '🍗' },
  { value: 'dairy', label: 'Dairy', icon: '🥛' },
  { value: 'fats', label: 'Fats & Oils', icon: '🥑' },
  { value: 'beverages', label: 'Beverages', icon: '🥤' },
  { value: 'snacks', label: 'Snacks', icon: '🍿' },
  { value: 'prepared-foods', label: 'Prepared Foods', icon: '🍱' },
  { value: 'other', label: 'Other', icon: '🍽️' },
];

/**
 * Sample daily intake targets based on common dietary approaches
 */
export const macroDistributionPresets = {
  'Balanced': { protein: 20, carbs: 50, fat: 30 },
  'High Protein': { protein: 30, carbs: 40, fat: 30 },
  'Low Carb': { protein: 25, carbs: 20, fat: 55 },
  'Mediterranean': { protein: 18, carbs: 45, fat: 37 },
  'Plant-Based': { protein: 15, carbs: 60, fat: 25 },
};