import { create } from 'zustand';
import { Food, FoodEntry, DailyLog, UserProfile, NutritionGoals } from '../types/nutrition';
import { storageService } from '../services/storage';
import { showToastSuccess, showToastError } from '../utils/toastUtils';
import { getTodayString, getDateOffset } from '../utils/dateHelpers';

interface NutritionState {
  // Data
  foods: Food[];
  currentDayLog: DailyLog | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  
  // Current state
  selectedDate: string;
  
  // Services
  storageService: typeof storageService;
  
  // Actions
  initializeApp: () => Promise<void>;
  loadFoods: () => Promise<void>;
  loadDailyLog: (date: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  
  // Food management
  addFood: (food: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFood: (foodId: string, updates: Partial<Food>) => Promise<void>;
  deleteFood: (foodId: string) => Promise<void>;
  searchFoods: (query: string) => Food[];
  
  // Food entry management
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => Promise<void>;
  updateFoodEntry: (entryId: string, updates: Partial<FoodEntry>) => Promise<void>;
  deleteFoodEntry: (entryId: string) => Promise<void>;
  
  // User profile management
  createUserProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateNutritionGoals: (goals: NutritionGoals) => Promise<void>;
  
  // Date navigation
  setSelectedDate: (date: string) => Promise<void>;
  goToToday: () => Promise<void>;
  goToPreviousDay: () => Promise<void>;
  goToNextDay: () => Promise<void>;
  
  // ChatGPT API Key management
  chatGptApiKey: string | null;
  loadChatGptApiKey: () => Promise<void>;
  saveChatGptApiKey: (apiKey: string) => Promise<void>;
  deleteChatGptApiKey: () => Promise<void>;

  // Trends and analytics
  getHistoricalCalories: (days?: number) => Promise<Array<{ date: string; calories: number }>>;
  getWeeklyRunningAverage: (days?: number) => Promise<Array<{ date: string; average: number }>>;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const useNutritionStore = create<NutritionState>((set, get) => ({
  // Initial state
  foods: [],
  currentDayLog: null,
  userProfile: null,
  isLoading: false,
  selectedDate: getTodayString(),
  chatGptApiKey: null,
  
  // Services
  storageService,
  
  // Initialize app
  initializeApp: async () => {
    set({ isLoading: true });
    try {
      await Promise.all([
        get().loadFoods(),
        get().loadUserProfile(),
        get().loadDailyLog(get().selectedDate),
        get().loadChatGptApiKey(),
      ]);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Load foods from storage
  loadFoods: async () => {
    try {
      const foods = await storageService.getFoods();
      set({ foods });
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  },
  
  // Load daily log for specific date
  loadDailyLog: async (date: string) => {
    try {
      const dailyLog = await storageService.getDailyLog(date);
      set({ currentDayLog: dailyLog, selectedDate: date });
    } catch (error) {
      console.error('Error loading daily log:', error);
    }
  },
  
  // Load user profile
  loadUserProfile: async () => {
    try {
      const profile = await storageService.getUserProfile();
      set({ userProfile: profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  },
  
  // Add new food
  addFood: async (foodData) => {
    try {
      const newFood: Food = {
        ...foodData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await storageService.saveFood(newFood);
      set(state => ({ foods: [...state.foods, newFood] }));
      showToastSuccess('Food created successfully!');
    } catch (error) {
      console.error('Error adding food:', error);
      showToastError('Failed to create food. Please try again.');
      throw error;
    }
  },
  
  // Update existing food
  updateFood: async (foodId, updates) => {
    try {
      const { foods } = get();
      const foodIndex = foods.findIndex(f => f.id === foodId);
      if (foodIndex === -1) throw new Error('Food not found');
      
      const updatedFood = {
        ...foods[foodIndex],
        ...updates,
        updatedAt: new Date(),
      };
      
      await storageService.saveFood(updatedFood);
      
      const newFoods = [...foods];
      newFoods[foodIndex] = updatedFood;
      set({ foods: newFoods });
      showToastSuccess('Food updated successfully!');
    } catch (error) {
      console.error('Error updating food:', error);
      showToastError('Failed to update food. Please try again.');
      throw error;
    }
  },
  
  // Delete food
  deleteFood: async (foodId) => {
    try {
      await storageService.deleteFood(foodId);
      set(state => ({ foods: state.foods.filter(f => f.id !== foodId) }));
      showToastSuccess('Food deleted successfully!');
    } catch (error) {
      console.error('Error deleting food:', error);
      showToastError('Failed to delete food. Please try again.');
      throw error;
    }
  },
  
  // Search foods
  searchFoods: (query) => {
    const { foods } = get();
    if (!query.trim()) return foods;
    
    const lowercaseQuery = query.toLowerCase();
    return foods.filter(food =>
      food.name.toLowerCase().includes(lowercaseQuery) ||
      food.brand?.toLowerCase().includes(lowercaseQuery) ||
      food.category?.toLowerCase().includes(lowercaseQuery)
    );
  },
  
  // Add food entry
  addFoodEntry: async (entryData) => {
    try {
      const { selectedDate, foods } = get();
      const food = foods.find(f => f.id === entryData.foodId);
      
      if (!food) throw new Error('Food not found');
      
      const newEntry: FoodEntry = {
        ...entryData,
        id: generateId(),
        food,
        loggedAt: entryData.loggedAt || new Date(),
      };
      
      await storageService.addFoodEntry(newEntry, selectedDate);
      await get().loadDailyLog(selectedDate); // Refresh the daily log
      showToastSuccess('Food entry added successfully!');
    } catch (error) {
      console.error('Error adding food entry:', error);
      showToastError('Failed to add food entry. Please try again.');
      throw error;
    }
  },
  
  // Update food entry
  updateFoodEntry: async (entryId, updates) => {
    try {
      const { selectedDate } = get();
      await storageService.updateFoodEntry(entryId, updates, selectedDate);
      await get().loadDailyLog(selectedDate); // Refresh the daily log
      showToastSuccess('Food entry updated successfully!');
    } catch (error) {
      console.error('Error updating food entry:', error);
      showToastError('Failed to update food entry. Please try again.');
      throw error;
    }
  },
  
  // Delete food entry
  deleteFoodEntry: async (entryId) => {
    try {
      const { selectedDate } = get();
      await storageService.deleteFoodEntry(entryId, selectedDate);
      await get().loadDailyLog(selectedDate); // Refresh the daily log
      showToastSuccess('Food entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting food entry:', error);
      showToastError('Failed to delete food entry. Please try again.');
      throw error;
    }
  },
  
  // Create user profile
  createUserProfile: async (profileData) => {
    try {
      const newProfile: UserProfile = {
        ...profileData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await storageService.saveUserProfile(newProfile);
      set({ userProfile: newProfile });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (updates) => {
    try {
      const { userProfile } = get();
      if (!userProfile) throw new Error('No user profile found');
      
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date(),
      };
      
      await storageService.saveUserProfile(updatedProfile);
      set({ userProfile: updatedProfile });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  // Update nutrition goals
  updateNutritionGoals: async (goals) => {
    try {
      await get().updateUserProfile({ goals });
    } catch (error) {
      console.error('Error updating nutrition goals:', error);
      throw error;
    }
  },
  
  // Date navigation
  setSelectedDate: async (date) => {
    set({ selectedDate: date });
    await get().loadDailyLog(date);
  },
  
  goToToday: async () => {
    const today = getTodayString();
    await get().setSelectedDate(today);
  },
  
  goToPreviousDay: async () => {
    const { selectedDate } = get();
    const previousDay = getDateOffset(selectedDate, -1);
    await get().setSelectedDate(previousDay);
  },
  
  goToNextDay: async () => {
    const { selectedDate } = get();
    const nextDay = getDateOffset(selectedDate, 1);
    await get().setSelectedDate(nextDay);
  },
  
  // ChatGPT API Key management
  loadChatGptApiKey: async () => {
    try {
      const apiKey = await storageService.getChatGPTApiKey();
      set({ chatGptApiKey: apiKey });
    } catch (error) {
      console.error('Error loading ChatGPT API key:', error);
    }
  },
  
  saveChatGptApiKey: async (apiKey: string) => {
    try {
      await storageService.saveChatGPTApiKey(apiKey);
      set({ chatGptApiKey: apiKey });
    } catch (error) {
      console.error('Error saving ChatGPT API key:', error);
      throw error;
    }
  },
  
  deleteChatGptApiKey: async () => {
    try {
      await storageService.deleteChatGPTApiKey();
      set({ chatGptApiKey: null });
    } catch (error) {
      console.error('Error deleting ChatGPT API key:', error);
      throw error;
    }
  },

  // Trends and analytics
  getHistoricalCalories: async (days: number = 30) => {
    try {
      const allLogs = await storageService.getDailyLogs();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const historicalData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const log = allLogs.find(l => l.date === dateString);
        historicalData.push({
          date: dateString,
          calories: log?.totalNutrition.calories || 0,
        });
      }
      
      return historicalData;
    } catch (error) {
      console.error('Error getting historical calories:', error);
      return [];
    }
  },

  getWeeklyRunningAverage: async (days: number = 30) => {
    try {
      const historicalData = await get().getHistoricalCalories(days);
      const weeklyAverages = [];
      
      for (let i = 6; i < historicalData.length; i++) {
        const weekData = historicalData.slice(i - 6, i + 1);
        
        // Only include days with actual food entries (calories > 0)
        const daysWithData = weekData.filter(day => day.calories > 0);
        
        // Only calculate average if we have at least 3 days of data in the week
        if (daysWithData.length >= 3) {
          const weekTotal = daysWithData.reduce((sum: number, day: { date: string; calories: number }) => sum + day.calories, 0);
          const weekAverage = weekTotal / daysWithData.length;
          
          weeklyAverages.push({
            date: historicalData[i].date,
            average: weekAverage,
          });
        }
      }
      
      return weeklyAverages;
    } catch (error) {
      console.error('Error calculating weekly running average:', error);
      return [];
    }
  },
}));