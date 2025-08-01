import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  FAB, 
  List, 
  IconButton,
  useTheme
} from 'react-native-paper';
import { format } from 'date-fns';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { FoodLogScreenProps } from '../../types/navigation';
import type { MealType, FoodEntry } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import DateNavigationCard from '../../components/DateNavigationCard';
import NutritionDisplay from '../../components/NutritionDisplay';

export default function FoodLogScreen({ navigation }: FoodLogScreenProps<'FoodLogHome'>) {
  const theme = useTheme();
  const {
    currentDayLog,
    selectedDate,
    deleteFoodEntry,
    goToPreviousDay,
    goToNextDay,
    goToToday,
  } = useNutritionStore();



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getEntriesForMeal = (mealType: MealType) => {
    return currentDayLog?.entries.filter(entry => entry.mealType === mealType) || [];
  };



  const calculateMealCalories = (mealType: MealType) => {
    const entries = getEntriesForMeal(mealType);
    return entries.reduce((total, entry) => {
      return total + calculateEntryNutrition(entry).calories;
    }, 0);
  };

  const handleDeleteEntry = (entryId: string, foodName: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete ${foodName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteFoodEntry(entryId)
        },
      ]
    );
  };

  const renderFoodEntry = (entry: FoodEntry) => {
    return (
      <List.Item
        key={entry.id}
        title={entry.food.name}
        description={
          <View>
            <NutritionDisplay entry={entry} />
            {entry.food.brand && (
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                {entry.food.brand}
              </Text>
            )}
          </View>
        }
        left={(props) => (
          <View style={styles.mealTypeIndicator}>
            <Text variant="labelSmall" style={[styles.mealTypeText, { color: theme.colors.primary }]}>
              {entry.mealType.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        right={(props) => (
          <View style={styles.entryActions}>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteEntry(entry.id, entry.food.name)}
            />
          </View>
        )}
        style={styles.entryItem}
      />
    );
  };

  const renderMealSection = (mealType: MealType) => {
    const entries = getEntriesForMeal(mealType);
    const calories = calculateMealCalories(mealType);
    
    return (
      <Card key={mealType} style={styles.mealCard}>
        <Card.Content>
          <View style={styles.mealHeader}>
            <Title style={styles.mealTitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Title>
            <Text variant="bodyLarge" style={styles.mealCalories}>
              {Math.round(calories)} cal
            </Text>
          </View>
          
          {entries.length === 0 ? (
            <View style={styles.emptyMeal}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No food logged for {mealType}
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('Search')}
                style={styles.addFoodButton}
                icon="plus"
              >
                Add Food
              </Button>
            </View>
          ) : (
            <View>
              {entries.map(renderFoodEntry)}
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Search')}
                style={styles.addMoreButton}
                icon="plus"
              >
                Add More
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Date Navigation */}
      <DateNavigationCard
        selectedDate={selectedDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      <ScrollView style={styles.scrollView}>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(renderMealSection)}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Search')}
        label="Add Food"
        color="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },


  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mealCard: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
  },
  mealCalories: {
    fontWeight: 'bold',
  },
  emptyMeal: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    opacity: 0.7,
    marginBottom: 12,
  },
  addFoodButton: {
    marginTop: 8,
  },
  addMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  entryItem: {
    paddingVertical: 8,
  },
  mealTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mealTypeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});