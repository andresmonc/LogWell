import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  ProgressBar, 
  useTheme, 
  Text, 
  Button, 
  IconButton, 
  Portal, 
  Modal, 
  Switch, 
  List 
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { DashboardScreenProps } from '../../types/navigation';
import type { DashboardMacroPreferences } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import DateNavigationCard from '../../components/DateNavigationCard';
import { SimpleLineChart } from '../../components';
import { sharedStyles, spacing } from '../../utils/sharedStyles';
import { handleError, ErrorMessages } from '../../utils/errorHandler';

function DashboardScreen({ navigation }: DashboardScreenProps<'DashboardHome'>) {
  const theme = useTheme();
  
DashboardScreen.displayName = 'DashboardScreen';
  const [showMacroSettings, setShowMacroSettings] = useState(false);
  const [trendsData, setTrendsData] = useState<Array<{ date: string; value: number }>>([]);
  const [weeklyAverageData, setWeeklyAverageData] = useState<Array<{ date: string; value: number }>>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  
  const {
    currentDayLog,
    userProfile,
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    initializeApp,
    updateUserProfile,
    getHistoricalCalories,
    getWeeklyRunningAverage,
  } = useNutritionStore();

  useEffect(() => {
    initializeApp();
    loadTrendsData();
  }, []);

  const loadTrendsData = async () => {
    setTrendsLoading(true);
    try {
      const [historicalData, weeklyData] = await Promise.all([
        getHistoricalCalories(14), // Last 14 days
        getWeeklyRunningAverage(14),
      ]);
      
      setTrendsData(historicalData.map((d: { date: string; calories: number }) => ({ date: d.date, value: d.calories })));
      setWeeklyAverageData(weeklyData.map((d: { date: string; average: number }) => ({ date: d.date, value: d.average })));
    } catch (error) {
      handleError(error, ErrorMessages.LOAD_DATA, { context: 'Load trends data', showAlert: false });
    } finally {
      setTrendsLoading(false);
    }
  };

  // Memoize expensive calculations
  const goals = useMemo(() => userProfile?.goals || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
  }, [userProfile?.goals]);

  const current = useMemo(() => currentDayLog?.totalNutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  }, [currentDayLog?.totalNutrition]);

  // Get macro preferences with smart defaults
  const macroPrefs = useMemo(() => userProfile?.dashboardMacros || {
    showProtein: true,
    showCarbs: false,
    showFat: false,
    showFiber: false,
    showSugar: false,
    showSodium: false,
  }, [userProfile?.dashboardMacros]);

  // Define available macros with their display info
  const availableMacros = useMemo(() => [
    { key: 'showProtein', label: 'Protein', current: current.protein, goal: goals.protein, unit: 'g', color: theme.colors.tertiary },
    { key: 'showCarbs', label: 'Carbs', current: current.carbs, goal: goals.carbs, unit: 'g', color: theme.colors.secondary },
    { key: 'showFat', label: 'Fat', current: current.fat, goal: goals.fat, unit: 'g', color: '#FF9800' },
    { key: 'showFiber', label: 'Fiber', current: current.fiber || 0, goal: goals.fiber || 25, unit: 'g', color: '#4CAF50' },
    { key: 'showSugar', label: 'Sugar', current: current.sugar || 0, goal: 50, unit: 'g', color: '#E91E63' },
    { key: 'showSodium', label: 'Sodium', current: current.sodium || 0, goal: 2300, unit: 'mg', color: '#9C27B0' },
  ] as const, [current, goals, theme.colors]);

  // Filter to only show selected macros
  const visibleMacros = useMemo(() => 
    availableMacros.filter(macro => macroPrefs[macro.key as keyof typeof macroPrefs]),
    [availableMacros, macroPrefs]
  );

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
    <View style={[sharedStyles.container, { backgroundColor: theme.colors.background }]}>
      {/* Date Navigation */}
      <DateNavigationCard
        selectedDate={selectedDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      <ScrollView style={sharedStyles.scrollView}>
        {/* Calorie Summary */}
        <Card style={sharedStyles.cardSpacing}>
        <Card.Content>
          <Title>Daily Calories</Title>
          <View style={[sharedStyles.rowCenter, styles.calorieContent]}>
            <Text variant="displayMedium" style={styles.calorieNumber}>
              {Math.round(current.calories)}
            </Text>
            <View style={sharedStyles.flex1}>
              <Text variant="bodyLarge">of {goals.calories} calories</Text>
              <Text variant="bodyMedium" style={sharedStyles.textSecondary}>
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
          <View style={sharedStyles.sectionHeader}>
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

      {/* Trends Section */}
      <Card style={sharedStyles.cardSpacing}>
        <Card.Content>
          <View style={sharedStyles.sectionHeader}>
            <Title>Trends</Title>
            <IconButton
              icon="refresh"
              size={20}
              onPress={loadTrendsData}
              disabled={trendsLoading}
            />
          </View>
          
          {trendsLoading ? (
            <View style={styles.trendsLoading}>
                                  <Text variant="bodyMedium" style={sharedStyles.textTertiary}>
                Loading trends...
              </Text>
            </View>
          ) : (
            <View>
                                  <Text variant="bodyMedium" style={[sharedStyles.textSecondary, styles.trendsSubtitle]}>
                Daily Calories (Last 14 Days)
              </Text>
              
              <SimpleLineChart
                data={trendsData}
                weeklyAverage={weeklyAverageData}
                height={180}
                color={theme.colors.primary}
                averageColor={theme.colors.tertiary}
              />
              
              <View style={styles.trendsLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                  <Text variant="bodySmall">Daily Calories</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: theme.colors.tertiary }]} />
                  <Text variant="bodySmall">7-Day Average</Text>
                </View>
              </View>
              
              {trendsData.length > 0 && (
                <View style={styles.trendsStats}>
                  <View style={styles.statItem}>
                    <Text variant="bodySmall" style={styles.statLabel}>Avg Daily</Text>
                    <Text variant="bodyLarge" style={styles.statValue}>
                      {Math.round(trendsData.reduce((sum, d) => sum + d.value, 0) / trendsData.length)} cal
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="bodySmall" style={styles.statLabel}>Goal</Text>
                    <Text variant="bodyLarge" style={styles.statValue}>
                      {goals.calories} cal
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="bodySmall" style={styles.statLabel}>Difference</Text>
                    <Text variant="bodyLarge" style={[
                      styles.statValue,
                      { color: trendsData.reduce((sum, d) => sum + d.value, 0) / trendsData.length >= goals.calories 
                        ? theme.colors.error : theme.colors.primary }
                    ]}>
                      {Math.round((trendsData.reduce((sum, d) => sum + d.value, 0) / trendsData.length) - goals.calories)} cal
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

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
          contentContainerStyle={[sharedStyles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={sharedStyles.marginBottomSmall}>Customize Macros</Title>
          <Text variant="bodyMedium" style={[sharedStyles.textSecondary, sharedStyles.marginBottomLarge]}>
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
            style={sharedStyles.modalButton}
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
  // Keeping calorieContent with specific marginVertical
  calorieContent: {
    marginVertical: spacing.sm,
  },
  calorieNumber: {
    fontWeight: 'bold',
    marginRight: 16,
  },
  // Removed calorieDetails and calorieRemaining - using shared styles
  calorieProgress: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  nutritionCard: {
    width: '31%', // Fixed width for 3 per row
    marginHorizontal: '1%', // Spacing between cards (31% + 1% + 31% + 1% + 31% + 1% = 96%)
    marginBottom: spacing.sm, // Spacing between rows
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
    marginBottom: spacing.lg,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
    marginBottom: spacing.lg,
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
    ...sharedStyles.headerRow,
    marginBottom: spacing.sm,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  // Removed modal styles - using shared styles
  // Removed trendsCard and trendsHeader - using shared styles
  trendsSubtitle: {
    marginBottom: spacing.lg,
  },
  trendsLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  // Removed loadingText - using shared textTertiary
  trendsLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 20,
    height: 2,
    opacity: 0.8,
  },
  trendsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
});

export default DashboardScreen;