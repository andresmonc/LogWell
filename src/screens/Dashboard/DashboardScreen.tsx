import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, ProgressBar, useTheme, Text, Button } from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { DashboardScreenProps } from '../../types/navigation';
import { formatDisplayDate, getTodayString } from '../../utils/dateHelpers';

export default function DashboardScreen({ navigation }: DashboardScreenProps<'DashboardHome'>) {
  const theme = useTheme();
  const {
    currentDayLog,
    userProfile,
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    initializeApp,
  } = useNutritionStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const goals = userProfile?.goals || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
  };

  const current = currentDayLog?.totalNutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };



  const NutritionCard = ({ 
    title, 
    current, 
    goal, 
    unit, 
    color 
  }: { 
    title: string; 
    current: number; 
    goal: number; 
    unit: string; 
    color: string; 
  }) => {
    const percentage = goal > 0 ? Math.min(current / goal, 1) : 0;
    
    return (
      <Card style={styles.nutritionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color }}>{title}</Text>
          <Text variant="headlineSmall" style={styles.nutritionValue}>
            {Math.round(current)}{unit}
          </Text>
          <Text variant="bodySmall" style={styles.goalText}>
            of {Math.round(goal)}{unit}
          </Text>
          <ProgressBar 
            progress={percentage} 
            color={color}
            style={styles.progressBar}
          />
          <Text variant="bodySmall" style={styles.percentageText}>
            {Math.round(percentage * 100)}%
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Date Navigation */}
      <Card style={styles.dateCard}>
        <Card.Content>
          <View style={styles.dateNavigation}>
            <Button mode="text" onPress={goToPreviousDay} icon="chevron-left">
              Previous
            </Button>
            <View style={styles.dateContainer}>
              <Title style={styles.dateTitle}>{formatDisplayDate(selectedDate)}</Title>
              {selectedDate !== getTodayString() && (
                <Button mode="text" onPress={goToToday} compact>
                  Go to Today
                </Button>
              )}
            </View>
            <Button mode="text" onPress={goToNextDay} icon="chevron-right">
              Next
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Calorie Summary */}
      <Card style={styles.calorieCard}>
        <Card.Content>
          <Title>Daily Calories</Title>
          <View style={styles.calorieContent}>
            <Text variant="displayMedium" style={styles.calorieNumber}>
              {Math.round(current.calories)}
            </Text>
            <View style={styles.calorieDetails}>
              <Text variant="bodyLarge">of {goals.calories} calories</Text>
              <Text variant="bodyMedium" style={styles.calorieRemaining}>
                {goals.calories - current.calories > 0 
                  ? `${Math.round(goals.calories - current.calories)} remaining`
                  : `${Math.round(current.calories - goals.calories)} over goal`
                }
              </Text>
            </View>
          </View>
          <ProgressBar 
            progress={Math.min(current.calories / goals.calories, 1)} 
            color={theme.colors.primary}
            style={styles.calorieProgress}
          />
        </Card.Content>
      </Card>

      {/* Macronutrients */}
      <View style={styles.macroGrid}>
        <NutritionCard
          title="Protein"
          current={current.protein}
          goal={goals.protein}
          unit="g"
          color={theme.colors.tertiary}
        />
        <NutritionCard
          title="Carbs"
          current={current.carbs}
          goal={goals.carbs}
          unit="g"
          color={theme.colors.secondary}
        />
        <NutritionCard
          title="Fat"
          current={current.fat}
          goal={goals.fat}
          unit="g"
          color="#FF9800"
        />
      </View>

      {/* Recent Meals */}
      {currentDayLog && currentDayLog.entries.length > 0 && (
        <Card style={styles.mealsCard}>
          <Card.Content>
            <Title>Recent Meals</Title>
            {currentDayLog.entries.slice(-3).map((entry, index) => (
              <View key={entry.id} style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text variant="bodyLarge">{entry.food.name}</Text>
                  <Text variant="bodyMedium" style={styles.mealDetails}>
                    {entry.mealType} • {Math.round(entry.food.nutritionPer100g.calories * (entry.quantityUnit === 'grams' ? entry.quantity / 100 : entry.quantity * (entry.food.servingSize || 100) / 100))} cal
                  </Text>
                </View>
              </View>
            ))}
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('FoodLog')}
              style={styles.viewAllButton}
            >
              View All Meals
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Search')}
              style={styles.actionButton}
              icon="plus"
            >
              Add Food
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('FoodLog')}
              style={styles.actionButton}
              icon="book-open"
            >
              View Food Log
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dateCard: {
    marginBottom: 16,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateTitle: {
    textAlign: 'center',
  },
  calorieCard: {
    marginBottom: 16,
  },
  calorieContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  calorieNumber: {
    fontWeight: 'bold',
    marginRight: 16,
  },
  calorieDetails: {
    flex: 1,
  },
  calorieRemaining: {
    opacity: 0.7,
  },
  calorieProgress: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  macroGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  nutritionCard: {
    flex: 1,
  },
  nutritionValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  goalText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  percentageText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  mealsCard: {
    marginBottom: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mealInfo: {
    flex: 1,
  },
  mealDetails: {
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  viewAllButton: {
    marginTop: 12,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});