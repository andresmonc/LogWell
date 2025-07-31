import { create } from 'zustand';
import { format } from 'date-fns';
import { Food, FoodEntry, DailyLog, UserProfile, NutritionGoals } from '../types/nutrition';
import { storageService } from '../services/storage';

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
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const useNutritionStore = create<NutritionState>((set, get) => ({
  // Initial state
  foods: [],
  currentDayLog: null,
  userProfile: null,
  isLoading: false,
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  
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
    } catch (error) {
      console.error('Error adding food:', error);
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
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  },
  
  // Delete food
  deleteFood: async (foodId) => {
    try {
      await storageService.deleteFood(foodId);
      set(state => ({ foods: state.foods.filter(f => f.id !== foodId) }));
    } catch (error) {
      console.error('Error deleting food:', error);
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
        loggedAt: new Date(),
      };
      
      await storageService.addFoodEntry(newEntry, selectedDate);
      await get().loadDailyLog(selectedDate); // Refresh the daily log
    } catch (error) {
      console.error('Error adding food entry:', error);
      throw error;
    }
  },
  
  // Update food entry
  updateFoodEntry: async (entryId, updates) => {
    try {
      const { selectedDate } = get();
      await storageService.updateFoodEntry(entryId, updates, selectedDate);
      await get().loadDailyLog(selectedDate); // Refresh the daily log
    } catch (error) {
      console.error('Error updating food entry:', error);
      throw error;
    }
  },
  
  // Delete food entry
  deleteFoodEntry: async (entryId) => {
    try {
      const { selectedDate } = get();
      await storageService.deleteFoodEntry(entryId, selectedDate);
      await get().loadDailyLog(selectedDate); // Refresh the daily log
    } catch (error) {
      console.error('Error deleting food entry:', error);
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
  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().loadDailyLog(date);
  },
  
  goToToday: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    get().setSelectedDate(today);
  },
  
  goToPreviousDay: () => {
    const { selectedDate } = get();
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    get().setSelectedDate(format(previousDay, 'yyyy-MM-dd'));
  },
  
  goToNextDay: () => {
    const { selectedDate } = get();
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    get().setSelectedDate(format(nextDay, 'yyyy-MM-dd'));
  },
}));