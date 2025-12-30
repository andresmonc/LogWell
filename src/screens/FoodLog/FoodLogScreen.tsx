import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  FAB,
  IconButton,
  useTheme
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { FoodLogScreenProps } from '../../types/navigation';
import type { MealType, FoodEntry } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import { formatTimeDisplay, formatHour, getHourKey } from '../../utils/dateHelpers';
import { showConfirmation } from '../../utils/alertUtils';
import { COLORS } from '../../utils/constants';
import { getMealTypeIcon, getMealTypeColor } from '../../utils/mealTypeHelpers';
import DateNavigationCard from '../../components/DateNavigationCard';
import NutritionDisplay from '../../components/NutritionDisplay';

function FoodLogScreen({ navigation }: FoodLogScreenProps<'FoodLogHome'>) {
  const theme = useTheme();
  const [fabOpen, setFabOpen] = useState(false);
  
  const {
    currentDayLog,
    selectedDate,
    deleteFoodEntry,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    loadDailyLog,
    userProfile
  } = useNutritionStore();

  // Ensure daily log is loaded when component mounts and when screen comes into focus
  useEffect(() => {
    const loadData = () => {
      loadDailyLog(selectedDate);
    };
    
    // Load on mount
    loadData();
    
    // Reload when screen comes into focus (handles refresh/navigation)
    const unsubscribe = navigation.addListener('focus', loadData);
    
    return unsubscribe;
  }, [navigation, selectedDate, loadDailyLog]);





  // Sort all entries chronologically
  const getSortedEntries = () => {
    if (!currentDayLog?.entries) return [];
    return [...currentDayLog.entries].sort((a, b) =>
      new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
    );
  };

  // Group entries by hour
  const getEntriesGroupedByHour = () => {
    const sortedEntries = getSortedEntries();
    const groupedEntries: { [hourKey: string]: { hour: Date; entries: FoodEntry[] } } = {};
    
    sortedEntries.forEach(entry => {
      const entryDate = new Date(entry.loggedAt);
      const hourKey = getHourKey(entryDate);
      
      if (!groupedEntries[hourKey]) {
        groupedEntries[hourKey] = {
          hour: entryDate,
          entries: []
        };
      }
      
      groupedEntries[hourKey].entries.push(entry);
    });
    
    return Object.values(groupedEntries).sort((a, b) => 
      a.hour.getTime() - b.hour.getTime()
    );
  };



  const handleDeleteEntry = (entryId: string, foodName: string) => {
    showConfirmation({
      title: 'Delete Entry',
      message: `Are you sure you want to delete ${foodName}?`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteFoodEntry(entryId)
    });
  };

  const renderFoodEntryInHour = (entry: FoodEntry) => {
    const nutrition = calculateEntryNutrition(entry);

    return (
      <Card key={entry.id} style={styles.hourEntryCard}>
        <Card.Content style={styles.hourEntryContent}>
          <View style={styles.entryHeader}>
            <View style={styles.entryMainInfo}>
              <Text variant="titleMedium" style={styles.foodName}>
                {entry.food.name}
              </Text>
              <Text variant="bodySmall" style={styles.entryTime}>
                {formatTimeDisplay(new Date(entry.loggedAt))}
              </Text>
            </View>
            <IconButton
              icon="delete"
              size={18}
              onPress={() => handleDeleteEntry(entry.id, entry.food.name)}
              style={styles.deleteButton}
            />
          </View>

          {entry.food.brand && (
            <Text variant="bodySmall" style={styles.brandText}>
              {entry.food.brand}
            </Text>
          )}

          <NutritionDisplay entry={entry} />
        </Card.Content>
      </Card>
    );
  };

  const renderHourGroup = (hourGroup: { hour: Date; entries: FoodEntry[] }, index: number, hourGroups: any[]) => {
    const isLast = index === hourGroups.length - 1;
    // Use the meal type from the first entry in this hour group
    const primaryMealType = hourGroup.entries[0]?.mealType || 'snack';
    const mealColor = getMealTypeColor(primaryMealType);
    const mealIcon = getMealTypeIcon(primaryMealType);

    return (
      <View key={getHourKey(hourGroup.hour)} style={styles.timelineEntry}>
        {/* Timeline Line and Marker */}
        <View style={styles.timelineIndicator}>
          <View style={[styles.timelineLine, isLast && styles.timelineLineEnd]} />
          <View style={[styles.timelineMarker, { backgroundColor: mealColor }]}>
            <IconButton
              icon={mealIcon}
              size={16}
              iconColor="white"
              style={styles.timelineIcon}
            />
          </View>
        </View>

        {/* Hour Group Content */}
        <View style={styles.timelineContent}>
          {/* Hour Header */}
          <View style={styles.hourHeader}>
            <Text variant="titleMedium" style={[styles.hourTime, { color: mealColor }]}>
              {formatHour(hourGroup.hour)}
            </Text>
            <Text variant="bodySmall" style={styles.entryCount}>
              {hourGroup.entries.length} {hourGroup.entries.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {/* Food Entries for this hour */}
          <View style={styles.hourEntries}>
            {hourGroup.entries.map(renderFoodEntryInHour)}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyTimeline = () => {
    return (
      <View style={styles.emptyTimeline}>
        <IconButton
          icon="food-off"
          size={48}
          iconColor={theme.colors.outline}
          style={styles.emptyIcon}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          No meals logged yet
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          Start tracking your nutrition by adding your first meal
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Search')}
          style={styles.emptyButton}
          icon="plus"
        >
          Add Meal
        </Button>
      </View>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {getSortedEntries().length === 0 ? (
          renderEmptyTimeline()
        ) : (
          <View style={styles.timeline}>
            {getEntriesGroupedByHour().map((hourGroup, index, hourGroups) =>
              renderHourGroup(hourGroup, index, hourGroups)
            )}

            {/* Add More Button at End of Timeline */}
            <View style={styles.timelineEnd}>
              <View style={styles.endMarker}>
                <IconButton
                  icon="plus"
                  onPress={() => navigation.navigate('Search')}
                  size={16}
                  iconColor={theme.colors.primary}
                  style={styles.endIcon}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button Group */}
      {Platform.OS === 'web' ? (
        <View style={styles.webFabContainer}>
          {fabOpen && (
            <>
              <FAB
                icon="food-apple"
                label="Add Food"
                onPress={() => {
                  navigation.navigate('Search');
                  setFabOpen(false);
                }}
                style={[styles.webFab, styles.webFabSecondary]}
                color="white"
              />
              <FAB
                icon="chef-hat"
                label="Create Recipe"
                onPress={() => {
                  navigation.navigate('RecipeBuilder');
                  setFabOpen(false);
                }}
                style={[styles.webFab, styles.webFabPrimary]}
                color="white"
              />
            </>
          )}
          <FAB
            icon={fabOpen ? 'close' : 'plus'}
            onPress={() => setFabOpen(!fabOpen)}
            style={styles.webFabMain}
            color="white"
          />
        </View>
      ) : (
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'food-apple',
              label: 'Add Food',
              onPress: () => navigation.navigate('Search'),
            },
            {
              icon: 'chef-hat',
              label: 'Create Recipe',
              onPress: () => navigation.navigate('RecipeBuilder'),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fab}
          fabStyle={{ backgroundColor: theme.colors.primary }}
          color="white"
        />
      )}
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

  // Timeline Styles
  timeline: {
    paddingVertical: 8,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
  },
  timelineLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: COLORS.GRAY_LIGHT,
    top: 40,
    bottom: -16,
    left: 19,
  },
  timelineLineEnd: {
    bottom: 24,
  },
  timelineMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  timelineIcon: {
    margin: 0,
  },
  timelineContent: {
    flex: 1,
  },

  // Hour Group Styles
  hourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hourTime: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  entryCount: {
    opacity: 0.6,
    fontSize: 12,
  },
  hourEntries: {
    gap: 8,
  },
  hourEntryCard: {
    marginBottom: 0,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  hourEntryContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  entryMainInfo: {
    flex: 1,
  },
  entryTime: {
    opacity: 0.7,
    fontSize: 11,
    marginTop: 2,
  },
  foodName: {
    flex: 1,
    fontWeight: '600',
  },
  brandText: {
    opacity: 0.7,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    margin: 0,
    marginTop: -8,
  },

  // Timeline End
  timelineEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  endMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.GRAY_LIGHT,
    borderStyle: 'dashed',
  },
  endIcon: {
    margin: 0,
  },
  addMoreTimelineButton: {
    alignSelf: 'flex-start',
  },

  // Empty State
  emptyTimeline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.5,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },

  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  webFabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 12,
  },
  webFab: {
    marginBottom: 8,
  },
  webFabPrimary: {
    backgroundColor: '#4CAF50',
  },
  webFabSecondary: {
    backgroundColor: '#2196F3',
  },
  webFabMain: {
    backgroundColor: '#6200EE',
  },
});

FoodLogScreen.displayName = 'FoodLogScreen';

export default FoodLogScreen;