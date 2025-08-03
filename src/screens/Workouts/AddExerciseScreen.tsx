import React, { useState, useLayoutEffect, useEffect, useCallback, useRef } from 'react';
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
import { sharedStyles, spacing, fontSize } from '../../utils/sharedStyles';
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

  const PAGE_SIZE = 15; // Reduced to ensure initial load doesn't fill entire screen
  const flatListRef = useRef<FlatList>(null);
  const loadMoreTriggered = useRef(false);

  // Note: Exercise names are now pre-formatted in the JSON data

  // Utility function to remove duplicate exercises
  const deduplicateExercises = useCallback((exercises: WorkoutExercise[]) => {
    const seen = new Set<string>();
    return exercises.filter(exercise => {
      if (seen.has(exercise.id)) {
        console.warn(`Duplicate exercise filtered out: ${exercise.id} - ${exercise.name}`);
        return false;
      }
      seen.add(exercise.id);
      return true;
    });
  }, []);

  // Utility function to sort exercises alphabetically
  const sortExercisesAlphabetically = useCallback((exercises: WorkoutExercise[]) => {
    return [...exercises].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

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
          style={sharedStyles.headerButton}
          contentStyle={sharedStyles.headerButtonContent}
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
    loadMoreTriggered.current = false;
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
      
      // Debug: Check for duplicate IDs in the new batch
      const exerciseIds = workoutExercises.map(ex => ex.id);
      const uniqueIds = new Set(exerciseIds);
      if (exerciseIds.length !== uniqueIds.size) {
        console.warn('Duplicate exercise IDs detected in batch:', exerciseIds.filter((id, index) => exerciseIds.indexOf(id) !== index));
      }

      if (reset) {
        // Load body parts for filtering (only on initial load)
        const bodyPartsData = await exerciseService.getBodyParts();
        setBodyParts(bodyPartsData);
        
        const cleanWorkoutExercises = deduplicateExercises(workoutExercises);
        const sortedWorkoutExercises = sortExercisesAlphabetically(cleanWorkoutExercises);
        setAllExercises(sortedWorkoutExercises);
        setFilteredExercises(sortedWorkoutExercises);
      } else {
        // Append new exercises to existing list, filtering out duplicates and maintaining sort
        setAllExercises(prev => {
          const existingIds = new Set(prev.map(ex => ex.id));
          const newExercises = workoutExercises.filter(ex => !existingIds.has(ex.id));
          const combined = [...prev, ...newExercises];
          return sortExercisesAlphabetically(combined);
        });
        
        // Only update filtered exercises if we're not in search/filter mode
        if (!searchQuery && !selectedBodyPart) {
          setFilteredExercises(prev => {
            const existingIds = new Set(prev.map(ex => ex.id));
            const newExercises = workoutExercises.filter(ex => !existingIds.has(ex.id));
            const combined = [...prev, ...newExercises];
            return sortExercisesAlphabetically(combined);
          });
        }
      }

      // Check if we have more exercises to load
      setHasMoreExercises(paginationResult.hasMore);
      
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
      
      // Reset the load more trigger flag
      loadMoreTriggered.current = false;
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

  const handleLoadMore = useCallback(() => {
    if (loadMoreTriggered.current) {
      console.log('🔄 Load more already triggered, skipping...');
      return;
    }
    
    console.log('🔄 onEndReached triggered', { 
      isLoadingMore, 
      hasMoreExercises, 
      searchQuery: !!searchQuery, 
      selectedBodyPart: !!selectedBodyPart,
      currentPage,
      exercisesCount: filteredExercises.length
    });
    
    // Only load more if:
    // 1. Not currently loading
    // 2. There are more exercises to load
    // 3. Not in search/filter mode (for simplicity)
    if (!isLoadingMore && hasMoreExercises && !searchQuery && !selectedBodyPart) {
      console.log('✅ Loading more exercises...');
      loadMoreTriggered.current = true;
      loadExerciseData(false);
    } else {
      console.log('❌ Load more blocked:', { 
        isLoadingMore, 
        hasMoreExercises, 
        inSearchMode: !!(searchQuery || selectedBodyPart) 
      });
    }
  }, [isLoadingMore, hasMoreExercises, searchQuery, selectedBodyPart, currentPage, filteredExercises.length]);

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Distance from bottom to trigger loading
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !isLoadingMore && hasMoreExercises && !searchQuery && !selectedBodyPart && !loadMoreTriggered.current) {
      console.log('🔄 Scroll-based loading triggered');
      handleLoadMore();
    }
  }, [handleLoadMore, isLoadingMore, hasMoreExercises, searchQuery, selectedBodyPart]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Reset pagination when searching
    setCurrentPage(1);
    setHasMoreExercises(true);
    loadMoreTriggered.current = false;

    try {
      if (query.trim() === '' && !selectedBodyPart) {
        // No search term and no body part filter - reload initial data
        setIsSearching(false);
        await loadExerciseData(true);
        return;
      } else {
        // Search using the exercise service
        const searchResults = await exerciseService.searchWorkoutExercises(
          query.trim() || undefined,
          selectedBodyPart || undefined
        );
        const cleanSearchResults = deduplicateExercises(searchResults);
        const sortedSearchResults = sortExercisesAlphabetically(cleanSearchResults);
        setFilteredExercises(sortedSearchResults);
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
      const cleanFiltered = deduplicateExercises(filtered);
      const sortedFiltered = sortExercisesAlphabetically(cleanFiltered);
      setFilteredExercises(sortedFiltered);
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
    loadMoreTriggered.current = false;

    try {
      if (!bodyPartName && searchQuery.trim() === '') {
        // No filters - reload initial data
        setIsSearching(false);
        await loadExerciseData(true);
        return;
      } else {
        // Apply filters using the exercise service
        const searchResults = await exerciseService.searchWorkoutExercises(
          searchQuery.trim() || undefined,
          bodyPartName || undefined
        );
        const cleanSearchResults = deduplicateExercises(searchResults);
        const sortedSearchResults = sortExercisesAlphabetically(cleanSearchResults);
        setFilteredExercises(sortedSearchResults);
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
          sharedStyles.listItem,
          isSelected && [sharedStyles.listItemSelected, { borderColor: theme.colors.outline }]
        ]}
        onPress={() => handleExercisePress(exercise.id)}
        activeOpacity={0.7}
      >
        <View style={sharedStyles.listItemContent}>
          {/* Exercise Image - WebP Preview */}
          <View style={[
            sharedStyles.imageContainer,
            { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant }
          ]}>
            {exercise.image && hasExerciseImage(exercise.image) ? (
              <Image
                source={getExerciseImage(exercise.image)}
                style={sharedStyles.circularImage}
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
          <View style={sharedStyles.listItemDetails}>
            <Text
              variant="titleMedium"
              style={[
                sharedStyles.listItemTitle,
                isSelected && { color: theme.colors.primary }
              ]}
            >
              {exercise.name}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                sharedStyles.listItemSubtitle,
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

  const renderExerciseItem = useCallback(({ item, index }: { item: WorkoutExercise; index: number }) => (
    <View style={styles.exerciseItemContainer}>
      {renderExerciseRow(item)}
      {index < filteredExercises.length - 1 && (
        <Divider style={sharedStyles.listItemDivider} />
      )}
    </View>
  ), [selectedExercises, filteredExercises.length, theme.colors]);

  // Note: Removed getItemLayout to improve onEndReached reliability
  // FlatList will calculate item heights dynamically for better scroll detection

  const renderListFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={sharedStyles.loadingSpinner}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={sharedStyles.loadingSpinnerText}>Loading more exercises...</Text>
        {__DEV__ && (
          <Text style={sharedStyles.debugText}>
            Page {currentPage}, Has More: {hasMoreExercises.toString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[sharedStyles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={sharedStyles.searchSection}>
        <Searchbar
          placeholder="Search exercises..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={sharedStyles.searchBar}
        />
      </View>

              {/* Body Part Filters */}
      {!isLoading && bodyParts.length > 0 && (
        <View style={sharedStyles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sharedStyles.filterScrollContainer}
          >
            <Chip
              selected={selectedBodyPart === null}
              onPress={() => handleBodyPartFilter(null)}
              style={sharedStyles.filterChip}
              textStyle={{ fontSize: fontSize.sm }}
            >
              All
            </Chip>
            {bodyParts.map((bodyPart) => (
              <Chip
                key={bodyPart.id}
                selected={selectedBodyPart === bodyPart.name}
                onPress={() => handleBodyPartFilter(bodyPart.name)}
                style={sharedStyles.filterChip}
                textStyle={{ fontSize: fontSize.sm }}
              >
                {bodyPart.name}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Exercise List */}
      <View style={[sharedStyles.section, sharedStyles.flex1, { paddingHorizontal: spacing.lg }]}>
        <Text variant="titleLarge" style={sharedStyles.sectionTitle}>
          {selectedBodyPart ? `${selectedBodyPart} Exercises` : searchQuery ? 'Search Results' : 'Popular Exercises'}
        </Text>

        {isLoading ? (
          <View style={sharedStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={sharedStyles.loadingText}>Loading exercises...</Text>
          </View>
        ) : (
          <View style={sharedStyles.flex1}>
            {isSearching && (
              <View style={sharedStyles.loadingSpinner}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={sharedStyles.loadingSpinnerText}>Searching...</Text>
              </View>
            )}
            {filteredExercises.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={filteredExercises}
                keyExtractor={(item, index) => item.id || `exercise-${index}`}
                renderItem={renderExerciseItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                ListFooterComponent={renderListFooter}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                windowSize={10}
                initialNumToRender={6}
                keyboardShouldPersistTaps="handled"
                legacyImplementation={false}
              />
            ) : (
              <View style={sharedStyles.emptyState}>
                <Text style={[sharedStyles.emptyTitle, sharedStyles.textMedium]}>No exercises found</Text>
                {(searchQuery || selectedBodyPart) && (
                  <Text style={[sharedStyles.emptySubtitle, sharedStyles.textSecondary]}>
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
          style={[sharedStyles.fab, { backgroundColor: theme.colors.primary }]}
          label={`Add ${selectedExercises.size} exercise${selectedExercises.size > 1 ? 's' : ''}`}
          onPress={handleAddSelectedExercises}
          color={theme.colors.onPrimary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Only keeping styles that are unique to this screen
  exerciseItemContainer: {
    // Dynamic height for better onEndReached detection
  },
  fallbackIcon: {
    margin: 0,
  },
});