import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food, FoodEntry, DailyLog, UserProfile, NutritionInfo, Recipe } from '../types/nutrition';
import { WorkoutSession, WorkoutRoutine } from '../types/workout';
import { calculateTotalNutrition } from '../utils/nutritionCalculators';
import { generateId } from '../utils/idGenerator';
import { STORAGE_KEYS, AI_CONFIG } from '../utils/constants';
import type { AIModelId } from '../utils/constants';

class StorageService {
  private static readonly KEYS = STORAGE_KEYS;

  // Foods Management
  async getFoods(): Promise<Food[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.FOODS);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error retrieving foods:', error);
      return [];
    }
  }

  async saveFood(food: Food): Promise<void> {
    try {
      const foods = await this.getFoods();
      const existingIndex = foods.findIndex(f => f.id === food.id);

      if (existingIndex >= 0) {
        foods[existingIndex] = { ...food, updatedAt: new Date() };
      } else {
        foods.push(food);
      }

      await AsyncStorage.setItem(StorageService.KEYS.FOODS, JSON.stringify(foods));
    } catch (error) {
      console.error('Error saving food:', error);
      throw error;
    }
  }

  async deleteFood(foodId: string): Promise<void> {
    try {
      const foods = await this.getFoods();
      const filteredFoods = foods.filter(f => f.id !== foodId);
      await AsyncStorage.setItem(StorageService.KEYS.FOODS, JSON.stringify(filteredFoods));
    } catch (error) {
      console.error('Error deleting food:', error);
      throw error;
    }
  }

  async updateFood(foodId: string, updates: Partial<Food>): Promise<void> {
    try {
      const foods = await this.getFoods();
      const index = foods.findIndex(f => f.id === foodId);
      
      if (index === -1) {
        throw new Error('Food not found');
      }
      
      foods[index] = { 
        ...foods[index], 
        ...updates, 
        updatedAt: new Date() 
      };
      
      await AsyncStorage.setItem(StorageService.KEYS.FOODS, JSON.stringify(foods));
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  }

  async getFoodById(foodId: string): Promise<Food | null> {
    try {
      const foods = await this.getFoods();
      return foods.find(f => f.id === foodId) || null;
    } catch (error) {
      console.error('Error retrieving food by ID:', error);
      return null;
    }
  }

  // Daily Logs Management
  async getDailyLogs(): Promise<DailyLog[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.DAILY_LOGS);
      const logs = jsonValue ? JSON.parse(jsonValue) : [];
      // Convert date strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        entries: log.entries.map((entry: any) => ({
          ...entry,
          loggedAt: new Date(entry.loggedAt),
          food: {
            ...entry.food,
            createdAt: new Date(entry.food.createdAt),
            updatedAt: new Date(entry.food.updatedAt),
          },
        })),
      }));
    } catch (error) {
      console.error('Error retrieving daily logs:', error);
      return [];
    }
  }

  async getDailyLog(date: string): Promise<DailyLog | null> {
    try {
      const logs = await this.getDailyLogs();
      return logs.find(log => log.date === date) || null;
    } catch (error) {
      console.error('Error retrieving daily log:', error);
      return null;
    }
  }

  async saveDailyLog(dailyLog: DailyLog): Promise<void> {
    try {
      const logs = await this.getDailyLogs();
      const existingIndex = logs.findIndex(log => log.date === dailyLog.date);

      if (existingIndex >= 0) {
        logs[existingIndex] = dailyLog;
      } else {
        logs.push(dailyLog);
      }

      await AsyncStorage.setItem(StorageService.KEYS.DAILY_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving daily log:', error);
      throw error;
    }
  }

  async addFoodEntry(entry: FoodEntry, date: string): Promise<void> {
    try {
      let dailyLog = await this.getDailyLog(date);

      if (!dailyLog) {
        dailyLog = {
          id: `log_${date}`,
          date,
          entries: [],
          totalNutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
        };
      }

      dailyLog.entries.push(entry);
      dailyLog.totalNutrition = this.calculateTotalNutrition(dailyLog.entries);

      await this.saveDailyLog(dailyLog);
    } catch (error) {
      console.error('Error adding food entry:', error);
      throw error;
    }
  }

  async updateFoodEntry(entryId: string, updatedEntry: Partial<FoodEntry>, date: string): Promise<void> {
    try {
      const dailyLog = await this.getDailyLog(date);
      if (!dailyLog) return;

      const entryIndex = dailyLog.entries.findIndex(e => e.id === entryId);
      if (entryIndex >= 0) {
        dailyLog.entries[entryIndex] = { ...dailyLog.entries[entryIndex], ...updatedEntry };
        dailyLog.totalNutrition = this.calculateTotalNutrition(dailyLog.entries);
        await this.saveDailyLog(dailyLog);
      }
    } catch (error) {
      console.error('Error updating food entry:', error);
      throw error;
    }
  }

  async deleteFoodEntry(entryId: string, date: string): Promise<void> {
    try {
      const dailyLog = await this.getDailyLog(date);
      if (!dailyLog) return;

      dailyLog.entries = dailyLog.entries.filter(e => e.id !== entryId);
      dailyLog.totalNutrition = this.calculateTotalNutrition(dailyLog.entries);
      await this.saveDailyLog(dailyLog);
    } catch (error) {
      console.error('Error deleting food entry:', error);
      throw error;
    }
  }

  // User Profile Management
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.USER_PROFILE);
      if (!jsonValue) return null;

      const profile = JSON.parse(jsonValue);
      return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      };
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  // Utility Methods
  private calculateTotalNutrition(entries: FoodEntry[]): NutritionInfo {
    // Use the centralized calculation from nutritionCalculators
    return calculateTotalNutrition(entries);
  }

  // AI API Key Management (OpenRouter)
  async getAIApiKey(): Promise<string | null> {
    try {
      // First try new key
      let apiKey = await AsyncStorage.getItem(StorageService.KEYS.AI_API_KEY);
      
      // Migrate from legacy ChatGPT key if exists
      if (!apiKey) {
        const legacyKey = await AsyncStorage.getItem(StorageService.KEYS.CHATGPT_API_KEY_LEGACY);
        if (legacyKey) {
          // Migrate to new key (but user will need new OpenRouter key)
          // We don't auto-migrate the actual key since it's a different service
          console.log('Legacy ChatGPT API key found - user will need to configure OpenRouter key');
        }
      }
      
      return apiKey;
    } catch (error) {
      console.error('Error retrieving AI API key:', error);
      return null;
    }
  }

  async saveAIApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.AI_API_KEY, apiKey);
      // Clean up legacy key if it exists
      await AsyncStorage.removeItem(StorageService.KEYS.CHATGPT_API_KEY_LEGACY);
    } catch (error) {
      console.error('Error saving AI API key:', error);
      throw error;
    }
  }

  async deleteAIApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.AI_API_KEY);
    } catch (error) {
      console.error('Error deleting AI API key:', error);
      throw error;
    }
  }

  // AI Model Selection
  async getAIModel(): Promise<AIModelId> {
    try {
      const model = await AsyncStorage.getItem(StorageService.KEYS.AI_MODEL);
      return (model as AIModelId) || AI_CONFIG.DEFAULT_MODEL;
    } catch (error) {
      console.error('Error retrieving AI model:', error);
      return AI_CONFIG.DEFAULT_MODEL;
    }
  }

  async saveAIModel(model: AIModelId): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.AI_MODEL, model);
    } catch (error) {
      console.error('Error saving AI model:', error);
      throw error;
    }
  }

  // Workout Sessions Management
  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.WORKOUT_SESSIONS);
      const sessions = jsonValue ? JSON.parse(jsonValue) : [];
      
      // Convert date strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        createdAt: session.createdAt ? new Date(session.createdAt) : undefined,
        updatedAt: session.updatedAt ? new Date(session.updatedAt) : undefined,
        completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error retrieving workout sessions:', error);
      return [];
    }
  }

  async saveWorkoutSession(session: WorkoutSession): Promise<WorkoutSession> {
    try {
      const sessions = await this.getWorkoutSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      let savedSession: WorkoutSession;
      if (existingIndex >= 0) {
        savedSession = { ...session, updatedAt: new Date() };
        sessions[existingIndex] = savedSession;
      } else {
        savedSession = { 
          ...session, 
          id: generateId(), 
          createdAt: new Date(),
          updatedAt: new Date()
        };
        sessions.push(savedSession);
      }
 
      await AsyncStorage.setItem(StorageService.KEYS.WORKOUT_SESSIONS, JSON.stringify(sessions));
      return savedSession;
    } catch (error) {
      console.error('Error saving workout session:', error);
      throw error;
    }
  }

  async getCurrentWorkoutSession(routineId: string): Promise<WorkoutSession | null> {
    try {
      const sessions = await this.getWorkoutSessions();
      // Find the most recent active session for this routine
      return sessions.find(s => s.routineId === routineId && !s.completed) || null;
    } catch (error) {
      console.error('Error getting current workout session:', error);
      return null;
    }
  }

  async getActiveWorkoutSession(): Promise<WorkoutSession | null> {
    try {
      const sessions = await this.getWorkoutSessions();
      // Find any active session (not completed)
      return sessions.find(s => !s.completed) || null;
    } catch (error) {
      console.error('Error getting active workout session:', error);
      return null;
    }
  }

  async completeWorkoutSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getWorkoutSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);

      if (sessionIndex >= 0) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          completed: true,
          completedAt: new Date()
        };
        await AsyncStorage.setItem(StorageService.KEYS.WORKOUT_SESSIONS, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error completing workout session:', error);
      throw error;
    }
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(StorageService.KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Workout Routines
  async getWorkoutRoutines(): Promise<WorkoutRoutine[]> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.WORKOUT_ROUTINES);
      const routines = data ? JSON.parse(data) : [];
      
      // Convert date strings back to Date objects
      return routines.map((routine: any) => ({
        ...routine,
        createdAt: new Date(routine.createdAt),
        updatedAt: new Date(routine.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting workout routines:', error);
      return [];
    }
  }

  async saveWorkoutRoutine(routine: WorkoutRoutine): Promise<void> {
    try {
      const routines = await this.getWorkoutRoutines();
      const existingIndex = routines.findIndex(r => r.id === routine.id);

      const routineToSave = existingIndex >= 0 
        ? { ...routine, updatedAt: new Date() }
        : routine;

      if (existingIndex >= 0) {
        routines[existingIndex] = routineToSave;
      } else {
        routines.push(routineToSave);
      }

      await AsyncStorage.setItem(StorageService.KEYS.WORKOUT_ROUTINES, JSON.stringify(routines));
    } catch (error) {
      console.error('Error saving workout routine:', error);
      throw error;
    }
  }

  async deleteWorkoutRoutine(routineId: string): Promise<void> {
    try {
      const routines = await this.getWorkoutRoutines();
      const updatedRoutines = routines.filter(r => r.id !== routineId);
      await AsyncStorage.setItem(StorageService.KEYS.WORKOUT_ROUTINES, JSON.stringify(updatedRoutines));
    } catch (error) {
      console.error('Error deleting workout routine:', error);
      throw error;
    }
  }

  // Recipe Management
  async getRecipes(): Promise<Recipe[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.RECIPES);
      const recipes = jsonValue ? JSON.parse(jsonValue) : [];
      return recipes.map((recipe: any) => ({
        ...recipe,
        createdAt: new Date(recipe.createdAt),
        updatedAt: new Date(recipe.updatedAt),
        ingredients: recipe.ingredients.map((ing: any) => ({
          ...ing,
          food: {
            ...ing.food,
            createdAt: new Date(ing.food.createdAt),
            updatedAt: new Date(ing.food.updatedAt),
          },
        })),
      }));
    } catch (error) {
      console.error('Error retrieving recipes:', error);
      return [];
    }
  }

  async getRecipeById(recipeId: string): Promise<Recipe | null> {
    try {
      const recipes = await this.getRecipes();
      return recipes.find(r => r.id === recipeId) || null;
    } catch (error) {
      console.error('Error retrieving recipe by ID:', error);
      return null;
    }
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    try {
      const recipes = await this.getRecipes();
      const existingIndex = recipes.findIndex(r => r.id === recipe.id);

      if (existingIndex >= 0) {
        recipes[existingIndex] = { ...recipe, updatedAt: new Date() };
      } else {
        recipes.push(recipe);
      }

      await AsyncStorage.setItem(StorageService.KEYS.RECIPES, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const recipes = await this.getRecipes();
      const filteredRecipes = recipes.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem(StorageService.KEYS.RECIPES, JSON.stringify(filteredRecipes));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();