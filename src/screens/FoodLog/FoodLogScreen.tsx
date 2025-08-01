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
  useTheme,
  Divider
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



  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

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

  const renderTimelineEntry = (entry: FoodEntry, index: number, entries: FoodEntry[]) => {
    const isLast = index === entries.length - 1;
    const mealColor = getMealTypeColor();
    const mealIcon = getMealTypeIcon();

    return (
      <View key={entry.id} style={styles.timelineEntry}>
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

        {/* Entry Content */}
        <View style={styles.timelineContent}>
          {/* Time Header */}
          <View style={styles.timelineHeader}>
            <Text variant="bodySmall" style={[styles.timelineTime, { color: mealColor }]}>
              {formatTime(new Date(entry.loggedAt))}
            </Text>
            <Text variant="labelMedium" style={[styles.mealTypeLabel, { color: mealColor }]}>
              {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
            </Text>
          </View>

          {/* Food Entry Card */}
          <Card style={styles.timelineCard}>
            <Card.Content style={styles.timelineCardContent}>
              <View style={styles.entryHeader}>
                <Text variant="titleMedium" style={styles.foodName}>
                  {entry.food.name}
                </Text>
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
        </View>
      </View>
    );
  };

  const renderEmptyTimeline = () => {
    return (
      <View style={styles.emptyTimeline}>
        <IconButton
          icon="restaurant"
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
            {getSortedEntries().map((entry, index, entries) =>
              renderTimelineEntry(entry, index, entries)
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
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTime: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  mealTypeLabel: {
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineCard: {
    marginBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  timelineCardContent: {
    paddingVertical: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
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