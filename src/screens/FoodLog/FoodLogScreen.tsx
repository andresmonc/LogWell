import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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





  const getMealTypeColor = () => {
    return theme.colors.primary;
  };

  const getMealTypeIcon = () => {
    return 'food';
  };

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
    return (
      <Card key={entry.id} style={styles.hourEntryCard}>
        <Card.Content style={styles.hourEntryContent}>
          <View style={styles.entryHeader}>
            <View style={styles.entryMainInfo}>
              <Text variant="titleMedium" style={styles.foodName}>
                {entry.food.name}
              </Text>
              <View style={styles.entryMeta}>
                <Text variant="bodySmall" style={styles.entryTime}>
                  {formatTimeDisplay(new Date(entry.loggedAt))}
                </Text>
                <Text variant="labelSmall" style={styles.mealTypeBadge}>
                  {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
                </Text>
              </View>
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
    const mealColor = getMealTypeColor();
    const mealIcon = getMealTypeIcon();

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
          Add First Meal
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
    backgroundColor: '#E0E0E0',
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  entryTime: {
    opacity: 0.7,
    fontSize: 11,
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
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
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
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
});