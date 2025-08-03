import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import {
  Text,
  Button,
  Searchbar,
  useTheme,
  Avatar,
  Divider,
  IconButton,
  FAB,
  Chip
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import type { WorkoutExercise, BodyPart } from '../../types/exerciseData';
import { sharedStyles } from '../../utils/sharedStyles';
import { setPendingExercises } from '../../utils/exerciseTransfer';
import { exerciseService } from '../../services/exerciseService';
import { getExerciseImage, hasExerciseImage } from '../../utils/exerciseImages';

export default function AddExerciseScreen({ navigation, route }: WorkoutScreenProps<'AddExercise'>) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [filteredExercises, setFilteredExercises] = useState<WorkoutExercise[]>([]);
  const [allExercises, setAllExercises] = useState<WorkoutExercise[]>([]);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreExercises, setHasMoreExercises] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          textColor={theme.colors.onSurface}
        >
          Cancel
        </Button>
      ),
      headerRight: () => (
        <Button
          mode="contained"
          onPress={handleCreate}
          disabled={selectedExercises.size === 0}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
        >
          Add
        </Button>
      ),
      headerTitle: 'Add Exercise',
      headerTitleAlign: 'center',
    });
  }, [navigation, selectedExercises.size, theme]);

  // Load exercise data on component mount
  useEffect(() => {
    loadExerciseData();
  }, []);

  const loadExerciseData = async (reset = true) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(1);
        setHasMoreExercises(true);
      } else {
        setIsLoadingMore(true);
      }

      const page = reset ? 1 : currentPage;
      
      // Load exercises for the current page using pagination
      const paginationResult = await exerciseService.getPaginatedExercises(page, PAGE_SIZE);
      const workoutExercises = paginationResult.exercises.map(ex => exerciseService.convertToWorkoutExercise(ex));

      if (reset) {
        // Load body parts for filtering (only on initial load)
        const bodyPartsData = await exerciseService.getBodyParts();
        setBodyParts(bodyPartsData);
        
        setAllExercises(workoutExercises);
        setFilteredExercises(workoutExercises);
      } else {
        // Append new exercises to existing list
        setAllExercises(prev => [...prev, ...workoutExercises]);
        
        // Only update filtered exercises if we're not in search/filter mode
        if (!searchQuery && !selectedBodyPart) {
          setFilteredExercises(prev => [...prev, ...workoutExercises]);
        }
      }

      // Check if we have more exercises to load
      setHasMoreExercises(paginationResult.hasMore);
      
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load exercise data:', error);
      if (reset) {
        // Fallback to empty data if initial load fails
        setAllExercises([]);
        setFilteredExercises([]);
      }
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const handleCreate = () => {
    const selectedExerciseData = filteredExercises.filter(exercise =>
      selectedExercises.has(exercise.id)
    );

    // Store exercises in temporary storage and go back
    setPendingExercises(selectedExerciseData);
    navigation.goBack();
  };

  const handleLoadMore = () => {
    // Only load more if:
    // 1. Not currently loading
    // 2. There are more exercises to load
    // 3. Not in search/filter mode (for simplicity)
    if (!isLoadingMore && hasMoreExercises && !searchQuery && !selectedBodyPart) {
      loadExerciseData(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Reset pagination when searching
    setCurrentPage(1);
    setHasMoreExercises(true);

    try {
      if (query.trim() === '' && !selectedBodyPart) {
        // No search term and no body part filter - reload initial data
        loadExerciseData(true);
        return;
      } else {
        // Search using the exercise service
        const searchResults = await exerciseService.searchWorkoutExercises(
          query.trim() || undefined,
          selectedBodyPart || undefined
        );
        setFilteredExercises(searchResults);
        // Disable pagination for search results
        setHasMoreExercises(false);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to local filtering
      const filtered = allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(query.toLowerCase()) ||
        exercise.target.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredExercises(filtered);
      setHasMoreExercises(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBodyPartFilter = async (bodyPartName: string | null) => {
    setSelectedBodyPart(bodyPartName);
    setIsSearching(true);
    
    // Reset pagination when filtering
    setCurrentPage(1);
    setHasMoreExercises(true);

    try {
      if (!bodyPartName && searchQuery.trim() === '') {
        // No filters - reload initial data
        loadExerciseData(true);
        return;
      } else {
        // Apply filters using the exercise service
        const searchResults = await exerciseService.searchWorkoutExercises(
          searchQuery.trim() || undefined,
          bodyPartName || undefined
        );
        setFilteredExercises(searchResults);
        // Disable pagination for filtered results
        setHasMoreExercises(false);
      }
    } catch (error) {
      console.error('Filter failed:', error);
      setFilteredExercises(allExercises);
      setHasMoreExercises(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExercisePress = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const handleAddSelectedExercises = () => {
    handleCreate();
  };

  const renderExerciseRow = (exercise: WorkoutExercise) => {
    const isSelected = selectedExercises.has(exercise.id);

    return (
      <TouchableOpacity
        key={exercise.id}
        style={[
          styles.exerciseRow,
          isSelected && styles.exerciseRowSelected,
          { borderColor: theme.colors.outline }
        ]}
        onPress={() => handleExercisePress(exercise.id)}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseRowContent}>
          {/* Exercise Image - WebP Preview */}
          <View style={[
            styles.exerciseImageContainer,
            { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant }
          ]}>
            {exercise.image && hasExerciseImage(exercise.image) ? (
              <Image
                source={getExerciseImage(exercise.image)}
                style={styles.exerciseImage}
                resizeMode="cover"
                onLoad={() => console.log(`✅ Exercise image loaded: ${exercise.id}`)}
                onError={(error) => {
                  console.warn(`❌ Exercise image failed: ${exercise.id}`, error);
                }}
              />
            ) : (
              <Avatar.Icon
                size={50}
                icon="dumbbell"
                style={styles.fallbackIcon}
              />
            )}
          </View>

          {/* Exercise Details */}
          <View style={styles.exerciseDetails}>
            <Text
              variant="titleMedium"
              style={[
                styles.exerciseName,
                isSelected && { color: theme.colors.primary }
              ]}
            >
              {exercise.name}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.exerciseTarget,
                { color: theme.colors.onSurfaceVariant }
              ]}
            >
              {exercise.target}
            </Text>
          </View>

          {/* More Info Button */}
          <IconButton
            icon="information-outline"
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => {
              // TODO: Show exercise details
              console.log('Show info for:', exercise.name);
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderExerciseItem = ({ item, index }: { item: WorkoutExercise; index: number }) => (
    <View>
      {renderExerciseRow(item)}
      {index < filteredExercises.length - 1 && (
        <Divider style={styles.exerciseDivider} />
      )}
    </View>
  );

  const renderListFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadMoreText}>Loading more exercises...</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search exercises..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

              {/* Body Part Filters */}
      {!isLoading && bodyParts.length > 0 && (
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
          >
            <Chip
              selected={selectedBodyPart === null}
              onPress={() => handleBodyPartFilter(null)}
              style={styles.filterChip}
              textStyle={{ fontSize: 12 }}
            >
              All
            </Chip>
            {bodyParts.map((bodyPart) => (
              <Chip
                key={bodyPart.id}
                selected={selectedBodyPart === bodyPart.name}
                onPress={() => handleBodyPartFilter(bodyPart.name)}
                style={styles.filterChip}
                textStyle={{ fontSize: 12 }}
              >
                {bodyPart.name}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Exercise List */}
      <View style={styles.exercisesSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {selectedBodyPart ? `${selectedBodyPart} Exercises` : searchQuery ? 'Search Results' : 'Popular Exercises'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {isSearching && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.searchingText}>Searching...</Text>
              </View>
            )}
            {filteredExercises.length > 0 ? (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderListFooter}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                windowSize={10}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercises found</Text>
                {(searchQuery || selectedBodyPart) && (
                  <Text style={styles.emptySubText}>
                    Try adjusting your search or filters
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Floating Add Button */}
      {selectedExercises.size > 0 && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          label={`Add ${selectedExercises.size} exercise${selectedExercises.size > 1 ? 's' : ''}`}
          onPress={handleAddSelectedExercises}
          color={theme.colors.onPrimary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    marginRight: 8,
  },
  createButtonContent: {
    margin: -8,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filtersSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  filterButton: {
    flex: 1,
  },
  filterButtonContent: {
    paddingVertical: 4,
  },
  equipmentFilter: {
    marginRight: 6,
  },
  muscleFilter: {
    marginLeft: 6,
  },
  exercisesSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  exercisesList: {
    flex: 1,
  },
  exerciseRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginVertical: 2,
  },
  exerciseRowSelected: {
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    borderWidth: 1,
  },
  exerciseRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  fallbackIcon: {
    margin: 0,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  exerciseTarget: {
    fontSize: 12,
  },
  exerciseDivider: {
    marginVertical: 4,
    marginLeft: 66, // Align with text content
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    elevation: 6,
  },
  filterScrollContainer: {
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
    marginVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.7,
  },
});