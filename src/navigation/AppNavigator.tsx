import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

import type { 
  TabParamList, 
  DashboardStackParamList,
  FoodLogStackParamList,
  SearchStackParamList,
  ProfileStackParamList 
} from '../types/navigation';

// Import screens (we'll create these next)
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import FoodLogScreen from '../screens/FoodLog/FoodLogScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const FoodLogStack = createStackNavigator<FoodLogStackParamList>();
const SearchStack = createStackNavigator<SearchStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Stack Navigators
function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </DashboardStack.Navigator>
  );
}

function FoodLogStackNavigator() {
  return (
    <FoodLogStack.Navigator>
      <FoodLogStack.Screen 
        name="FoodLogHome" 
        component={FoodLogScreen}
        options={{ title: 'Food Log' }}
      />
    </FoodLogStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen 
        name="SearchHome" 
        component={SearchScreen}
        options={{ title: 'Add Food' }}
      />
    </SearchStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
export default function AppNavigator() {
  const theme = useTheme();
  
  return (
    <NavigationContainer>
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
              case 'Search':
                iconName = 'add-circle';
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
          name="Search" 
          component={SearchStackNavigator}
          options={{ title: 'Add Food' }}
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