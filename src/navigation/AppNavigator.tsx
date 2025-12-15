import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

// Platform-specific icon import
let Icon: any;
if (Platform.OS === 'web') {
  // On web, use our WebIcon component
  Icon = require('../components/WebIcon').default;
} else {
  // On native, use the regular vector icons
  Icon = require('react-native-vector-icons/MaterialIcons').default;
}

import type { 
  TabParamList, 
  DashboardStackParamList,
  FoodLogStackParamList,
  WorkoutStackParamList,
  ProfileStackParamList 
} from '../types/navigation';

// Import screens
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import FoodLogScreen from '../screens/FoodLog/FoodLogScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import RecipeBuilderScreen from '../screens/FoodLog/RecipeBuilderScreen';
import WorkoutScreen from '../screens/Workouts/WorkoutScreen';
import WorkoutSessionScreen from '../screens/Workouts/WorkoutSessionScreen';
import CreateRoutineScreen from '../screens/Workouts/CreateRoutineScreen';
import AddExerciseScreen from '../screens/Workouts/AddExerciseScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';


const Tab = createBottomTabNavigator<TabParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const FoodLogStack = createStackNavigator<FoodLogStackParamList>();
const WorkoutStack = createStackNavigator<WorkoutStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Stack Navigators
function DashboardStackNavigator() {
  const theme = useTheme();
  
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerShown: false }}
      />
    </DashboardStack.Navigator>
  );
}

function FoodLogStackNavigator() {
  const theme = useTheme();
  
  return (
    <FoodLogStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
      <FoodLogStack.Screen 
        name="FoodLogHome" 
        component={FoodLogScreen}
        options={{ title: 'Food Log', headerShown: false }}
      />
      <FoodLogStack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Add Food' }}
      />
      <FoodLogStack.Screen 
        name="RecipeBuilder" 
        component={RecipeBuilderScreen}
        options={{ title: 'Create Recipe' }}
      />
    </FoodLogStack.Navigator>
  );
}

function WorkoutStackNavigator() {
  const theme = useTheme();
  
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
      <WorkoutStack.Screen 
        name="WorkoutHome" 
        component={WorkoutScreen}
        options={{ title: 'Workouts', headerShown: false }}
      />
      <WorkoutStack.Screen 
        name="CreateRoutine" 
        component={CreateRoutineScreen}
        options={{ title: 'Create Routine' }}
      />
      <WorkoutStack.Screen 
        name="AddExercise" 
        component={AddExerciseScreen}
        options={{ title: 'Add Exercise' }}
      />
      <WorkoutStack.Screen 
        name="WorkoutSession" 
        component={WorkoutSessionScreen}
        options={({ route }) => ({ title: route.params.routineName })}
      />
    </WorkoutStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const theme = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ title: 'Profile', headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
export default function AppNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState();
  
  // Load navigation state from AsyncStorage on mount
  React.useEffect(() => {
    const loadNavigationState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEYS.NAVIGATION_STATE);
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('Error loading navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadNavigationState();
  }, []);

  // Persist navigation state to AsyncStorage whenever it changes
  const handleStateChange = React.useCallback((state: any) => {
    try {
      AsyncStorage.setItem(STORAGE_KEYS.NAVIGATION_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Error persisting navigation state:', error);
    }
  }, []);

  // Don't render until we've loaded the saved state
  if (!isReady) {
    return null;
  }
  
  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={handleStateChange}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
              case 'Dashboard':
                iconName = 'dashboard';
                break;
              case 'FoodLog':
                iconName = 'restaurant';
                break;
              case 'Workouts':
                iconName = 'fitness-center';
                break;
              case 'Profile':
                iconName = 'person';
                break;
              default:
                iconName = 'help';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8,
            height: Platform.OS === 'ios' ? 60 + Math.max(insets.bottom, 8) : 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardStackNavigator}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen 
          name="FoodLog" 
          component={FoodLogStackNavigator}
          options={{ title: 'Food Log' }}
        />
        <Tab.Screen 
          name="Workouts" 
          component={WorkoutStackNavigator}
          options={{ title: 'Workouts' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStackNavigator}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}