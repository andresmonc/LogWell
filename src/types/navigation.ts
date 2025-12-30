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
};

export type FoodLogStackParamList = {
  FoodLogHome: undefined;
  Search: { selectMode?: boolean } | undefined;
  RecipeBuilder: { recipeId?: string } | undefined;
};

export type WorkoutStackParamList = {
  WorkoutHome: undefined;
  WorkoutSession: { 
    routineId: string; 
    routineName: string; 
    exercises: string[];
  };
  CreateRoutine: {
    editRoutine?: {
      id: string;
      name: string;
      exercises: string[];
    };
  } | undefined;
  AddExercise: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
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

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    TabScreenProps<'Profile'>
  >;