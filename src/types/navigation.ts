import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';

// Bottom Tab Navigator
export type TabParamList = {
  Dashboard: undefined;
  FoodLog: undefined;
  Workouts: undefined;
  Profile: undefined;
};

// Stack Navigator for each tab
export type DashboardStackParamList = {
  DashboardHome: undefined;
  NutritionDetails: { date: string };
};

export type FoodLogStackParamList = {
  FoodLogHome: undefined;
  AddFood: { mealType?: string };
  FoodDetails: { foodId: string };
  EditEntry: { entryId: string };
  Search: undefined;
};

export type WorkoutStackParamList = {
  WorkoutHome: undefined;
  WorkoutSession: { 
    routineId: string; 
    routineName: string; 
    exercises: string[];
  };
  CreateRoutine: undefined;
  AddExercise: undefined;
};

export type SearchStackParamList = {
  SearchHome: undefined;
  FoodSearch: undefined;
  CreateFood: undefined;
  ScanBarcode: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Goals: undefined;
  About: undefined;
};

// Screen Props Types
export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>;

export type DashboardScreenProps<T extends keyof DashboardStackParamList> =
  CompositeScreenProps<
    StackScreenProps<DashboardStackParamList, T>,
    TabScreenProps<'Dashboard'>
  >;

export type FoodLogScreenProps<T extends keyof FoodLogStackParamList> =
  CompositeScreenProps<
    StackScreenProps<FoodLogStackParamList, T>,
    TabScreenProps<'FoodLog'>
  >;

export type WorkoutScreenProps<T extends keyof WorkoutStackParamList> =
  CompositeScreenProps<
    StackScreenProps<WorkoutStackParamList, T>,
    TabScreenProps<'Workouts'>
  >;

export type SearchScreenProps<T extends keyof SearchStackParamList> =
  CompositeScreenProps<
    StackScreenProps<SearchStackParamList, T>,
    TabScreenProps<'FoodLog'>
  >;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    TabScreenProps<'Profile'>
  >;