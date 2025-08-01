import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, ProgressBar, useTheme, Text, Button, IconButton, Portal, Modal } from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { DashboardScreenProps } from '../../types/navigation';
import type { DashboardMacroPreferences } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import DateNavigationCard from '../../components/DateNavigationCard';
import { Switch, List } from 'react-native-paper';

export default function DashboardScreen({ navigation }: DashboardScreenProps<'DashboardHome'>) {
  const theme = useTheme();
  const [showMacroSettings, setShowMacroSettings] = useState(false);
  const {
    currentDayLog,
    userProfile,
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    initializeApp,
    updateUserProfile,
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
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  // Get macro preferences with smart defaults
  const macroPrefs = userProfile?.dashboardMacros || {
    showProtein: true,
    showCarbs: false,
    showFat: false,
    showFiber: false,
    showSugar: false,
    showSodium: false,
  };

  // Define available macros with their display info
  const availableMacros = [
    { key: 'showProtein', label: 'Protein', current: current.protein, goal: goals.protein, unit: 'g', color: theme.colors.tertiary },
    { key: 'showCarbs', label: 'Carbs', current: current.carbs, goal: goals.carbs, unit: 'g', color: theme.colors.secondary },
    { key: 'showFat', label: 'Fat', current: current.fat, goal: goals.fat, unit: 'g', color: '#FF9800' },
    { key: 'showFiber', label: 'Fiber', current: current.fiber || 0, goal: goals.fiber || 25, unit: 'g', color: '#4CAF50' },
    { key: 'showSugar', label: 'Sugar', current: current.sugar || 0, goal: 50, unit: 'g', color: '#E91E63' },
    { key: 'showSodium', label: 'Sodium', current: current.sodium || 0, goal: 2300, unit: 'mg', color: '#9C27B0' },
  ] as const;

  // Filter to only show selected macros
  const visibleMacros = availableMacros.filter(macro => macroPrefs[macro.key]);

  const updateMacroPreference = (key: keyof DashboardMacroPreferences, value: boolean) => {
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        dashboardMacros: {
          ...macroPrefs,
          [key]: value,
        },
      };
      updateUserProfile(updatedProfile);
    }
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Date Navigation */}
      <DateNavigationCard
        selectedDate={selectedDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      <ScrollView style={styles.scrollView}>
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
      {visibleMacros.length > 0 && (
        <View>
          <View style={styles.macroHeader}>
            <Title>Macros</Title>
            <IconButton
              icon="cog"
              size={20}
              onPress={() => setShowMacroSettings(true)}
            />
          </View>
          <View style={styles.macroGrid}>
            {visibleMacros.map((macro) => (
              <NutritionCard
                key={macro.key}
                title={macro.label}
                current={macro.current}
                goal={macro.goal}
                unit={macro.unit}
                color={macro.color}
              />
            ))}
          </View>
        </View>
      )}

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
                    {entry.mealType} • {Math.round(calculateEntryNutrition(entry).calories)} cal
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
              onPress={() => navigation.navigate('FoodLog')}
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

      {/* Macro Settings Modal */}
      <Portal>
        <Modal
          visible={showMacroSettings}
          onDismiss={() => setShowMacroSettings(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={styles.modalTitle}>Customize Macros</Title>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Choose which macros to display on your dashboard
          </Text>

          {availableMacros.map((macro) => (
            <List.Item
              key={macro.key}
              title={macro.label}
              description={`Current: ${Math.round(macro.current)}${macro.unit} / Goal: ${Math.round(macro.goal)}${macro.unit}`}
              left={(props) => <List.Icon {...props} icon="nutrition" color={macro.color} />}
              right={() => (
                <Switch
                  value={macroPrefs[macro.key]}
                  onValueChange={(value) => updateMacroPreference(macro.key, value)}
                />
              )}
            />
          ))}

          <Button
            mode="contained"
            onPress={() => setShowMacroSettings(false)}
            style={styles.modalButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>
      </ScrollView>
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
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  nutritionCard: {
    width: '31%', // Fixed width for 3 per row
    marginHorizontal: '1%', // Spacing between cards (31% + 1% + 31% + 1% + 31% + 1% = 96%)
    marginBottom: 8, // Spacing between rows
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
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalSubtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 16,
  },
});