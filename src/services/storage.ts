import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food, FoodEntry, DailyLog, UserProfile, NutritionInfo } from '../types/nutrition';

class StorageService {
  private static readonly KEYS = {
    FOODS: '@LogWell:foods',
    DAILY_LOGS: '@LogWell:daily_logs',
    USER_PROFILE: '@LogWell:user_profile',
    SETTINGS: '@LogWell:settings',
    CHATGPT_API_KEY: '@LogWell:chatgpt_api_key',
  } as const;

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
    return entries.reduce(
      (total: NutritionInfo, entry: FoodEntry): NutritionInfo => {
        const multiplier = entry.quantityUnit === 'grams' 
          ? entry.quantity / 100 
          : entry.quantity * (entry.food.servingSize || 100) / 100;
        
        return {
          calories: total.calories + (entry.food.nutritionPer100g.calories * multiplier),
          protein: total.protein + (entry.food.nutritionPer100g.protein * multiplier),
          carbs: total.carbs + (entry.food.nutritionPer100g.carbs * multiplier),
          fat: total.fat + (entry.food.nutritionPer100g.fat * multiplier),
          fiber: (total.fiber || 0) + ((entry.food.nutritionPer100g.fiber || 0) * multiplier),
          sugar: (total.sugar || 0) + ((entry.food.nutritionPer100g.sugar || 0) * multiplier),
          sodium: (total.sodium || 0) + ((entry.food.nutritionPer100g.sodium || 0) * multiplier),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 } as NutritionInfo
    );
  }

  // ChatGPT API Key Management
  async getChatGPTApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(StorageService.KEYS.CHATGPT_API_KEY);
    } catch (error) {
      console.error('Error retrieving ChatGPT API key:', error);
      return null;
    }
  }

  async saveChatGPTApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.CHATGPT_API_KEY, apiKey);
    } catch (error) {
      console.error('Error saving ChatGPT API key:', error);
      throw error;
    }
  }

  async deleteChatGPTApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.CHATGPT_API_KEY);
    } catch (error) {
      console.error('Error deleting ChatGPT API key:', error);
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
}

export const storageService = new StorageService();