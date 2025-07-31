import { Food, UserProfile, NutritionGoals } from '../types/nutrition';

/**
 * Sample foods for testing and initial app experience
 */
export const sampleFoods: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Chicken Breast',
    brand: 'Generic',
    nutritionPer100g: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sodium: 74,
    },
    servingSize: 100,
    servingSizeUnit: 'grams',
    category: 'proteins',
  },
  {
    name: 'Brown Rice',
    brand: 'Generic',
    nutritionPer100g: {
      calories: 123,
      protein: 2.6,
      carbs: 25,
      fat: 0.9,
      fiber: 1.8,
    },
    servingSize: 50,
    servingSizeUnit: 'grams',
    category: 'grains',
  },
  {
    name: 'Broccoli',
    nutritionPer100g: {
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      sodium: 33,
    },
    servingSize: 85,
    servingSizeUnit: 'grams',
    category: 'vegetables',
  },
  {
    name: 'Banana',
    nutritionPer100g: {
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12,
    },
    servingSize: 120,
    servingSizeUnit: 'grams',
    category: 'fruits',
  },
  {
    name: 'Greek Yogurt',
    brand: 'Plain',
    nutritionPer100g: {
      calories: 100,
      protein: 10,
      carbs: 3.6,
      fat: 5,
      sugar: 3.2,
      sodium: 36,
    },
    servingSize: 170,
    servingSizeUnit: 'grams',
    category: 'dairy',
  },
  {
    name: 'Almonds',
    nutritionPer100g: {
      calories: 579,
      protein: 21,
      carbs: 22,
      fat: 50,
      fiber: 12,
      sodium: 1,
    },
    servingSize: 28,
    servingSizeUnit: 'grams',
    category: 'fats',
  },
  {
    name: 'Oatmeal',
    brand: 'Plain',
    nutritionPer100g: {
      calories: 389,
      protein: 17,
      carbs: 66,
      fat: 7,
      fiber: 11,
      sodium: 2,
    },
    servingSize: 40,
    servingSizeUnit: 'grams',
    category: 'grains',
  },
  {
    name: 'Salmon',
    nutritionPer100g: {
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      sodium: 59,
    },
    servingSize: 150,
    servingSizeUnit: 'grams',
    category: 'proteins',
  },
  {
    name: 'Sweet Potato',
    nutritionPer100g: {
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      fiber: 3,
      sugar: 4.2,
      sodium: 54,
    },
    servingSize: 130,
    servingSizeUnit: 'grams',
    category: 'vegetables',
  },
  {
    name: 'Whole Wheat Bread',
    brand: 'Generic',
    nutritionPer100g: {
      calories: 247,
      protein: 13,
      carbs: 41,
      fat: 4.2,
      fiber: 7,
      sodium: 400,
    },
    servingSize: 30,
    servingSizeUnit: 'grams',
    category: 'grains',
  },
];

/**
 * Default nutrition goals for different profiles
 */
export const defaultNutritionGoals: Record<string, NutritionGoals> = {
  moderate: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
    water: 2000,
  },
  highProtein: {
    calories: 2200,
    protein: 165,
    carbs: 220,
    fat: 73,
    water: 2500,
  },
  lowCarb: {
    calories: 1800,
    protein: 135,
    carbs: 90,
    fat: 120,
    water: 2000,
  },
  weightLoss: {
    calories: 1600,
    protein: 120,
    carbs: 160,
    fat: 53,
    water: 2500,
  },
};

/**
 * Create a sample user profile
 */
export function createSampleUserProfile(): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Sample User',
    age: 30,
    gender: 'other',
    height: 170,
    weight: 70,
    activityLevel: 'moderately-active',
    goals: defaultNutritionGoals.moderate,
  };
}

/**
 * Initialize app with sample data for better first experience
 */
export async function initializeSampleData() {
  const { storageService } = await import('../services/storage');
  
  try {
    // Check if user already has data
    const existingFoods = await storageService.getFoods();
    const existingProfile = await storageService.getUserProfile();
    
    // Only add sample data if user has no existing data
    if (existingFoods.length === 0) {
      // Add sample foods
      for (const foodData of sampleFoods.slice(0, 5)) { // Add first 5 foods
        const food: Food = {
          ...foodData,
          id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await storageService.saveFood(food);
      }
      
      console.log('Sample foods added to help you get started!');
    }
    
    // Create sample profile if none exists
    if (!existingProfile) {
      const sampleProfile: UserProfile = {
        ...createSampleUserProfile(),
        id: `profile_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await storageService.saveUserProfile(sampleProfile);
      console.log('Sample profile created!');
    }
    
  } catch (error) {
    console.warn('Could not initialize sample data:', error);
  }
}

/**
 * Get nutrition goals by goal type
 */
export function getNutritionGoalsByType(type: keyof typeof defaultNutritionGoals): NutritionGoals {
  return defaultNutritionGoals[type] || defaultNutritionGoals.moderate;
}

/**
 * Calculate recommended goals based on user profile
 */
export function calculateRecommendedGoals(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active',
  goal: 'maintain' | 'lose' | 'gain' = 'maintain'
): NutritionGoals {
  // Calculate BMR using Mifflin-St Jeor equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Calculate TDEE
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly-active': 1.375,
    'moderately-active': 1.55,
    'very-active': 1.725,
    'extremely-active': 1.9,
  };
  
  let calories = bmr * activityMultipliers[activityLevel];
  
  // Adjust for goal
  if (goal === 'lose') {
    calories -= 500; // 500 calorie deficit for ~1lb/week loss
  } else if (goal === 'gain') {
    calories += 300; // 300 calorie surplus for gradual weight gain
  }
  
  // Calculate macros (balanced approach)
  const protein = weight * 1.6; // 1.6g per kg body weight
  const fat = (calories * 0.25) / 9; // 25% of calories from fat
  const carbs = (calories - (protein * 4) - (fat * 9)) / 4; // Remaining calories from carbs
  
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    water: 2000 + (weight * 15), // Base 2L + 15ml per kg body weight
  };
}