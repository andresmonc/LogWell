import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Text,
  Button,
  Searchbar,
  useTheme,
  Avatar,
  Divider,
  IconButton,
  FAB
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import { sharedStyles } from '../../utils/sharedStyles';

// Mock exercise data
const mockExercises = [
  { 
    id: '1', 
    name: 'Treadmill', 
    target: 'Cardio', 
    image: 'run',
    lastPerformed: '2 days ago'
  },
  { 
    id: '2', 
    name: 'Bench Press', 
    target: 'Chest', 
    image: 'weight-lifter',
    lastPerformed: '1 week ago'
  },
  { 
    id: '3', 
    name: 'Squats', 
    target: 'Legs', 
    image: 'human-handsdown',
    lastPerformed: '3 days ago'
  },
  { 
    id: '4', 
    name: 'Pull-ups', 
    target: 'Back', 
    image: 'arm-flex',
    lastPerformed: '5 days ago'
  },
  { 
    id: '5', 
    name: 'Overhead Press', 
    target: 'Shoulders', 
    image: 'dumbbell',
    lastPerformed: '1 week ago'
  },
];

export default function AddExerciseScreen({ navigation }: WorkoutScreenProps<'AddExercise'>) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [filteredExercises, setFilteredExercises] = useState(mockExercises);

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
          Create
        </Button>
      ),
      headerTitle: 'Add Exercise',
      headerTitleAlign: 'center',
    });
  }, [navigation, selectedExercises.size, theme]);

  const handleCreate = () => {
    // TODO: Pass selected exercises back to CreateRoutine
    console.log('Selected exercises:', Array.from(selectedExercises));
    navigation.goBack();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredExercises(mockExercises);
    } else {
      const filtered = mockExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(query.toLowerCase()) ||
        exercise.target.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredExercises(filtered);
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
    const selectedExerciseData = mockExercises.filter(exercise => 
      selectedExercises.has(exercise.id)
    );
    
    // Navigate back with selected exercises
    navigation.navigate('CreateRoutine', { selectedExercises: selectedExerciseData });
  };

  const renderExerciseRow = (exercise: typeof mockExercises[0]) => {
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
          {/* Exercise Image */}
          <Avatar.Icon
            size={50}
            icon={exercise.image}
            style={[
              styles.exerciseImage,
              { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant }
            ]}
          />
          
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

      {/* Filters Section - Placeholder */}
      <View style={styles.filtersSection}>
        <Button
          mode="outlined"
          style={[styles.filterButton, styles.equipmentFilter]}
          contentStyle={styles.filterButtonContent}
          disabled
        >
          Equipment Filter
        </Button>
        <Button
          mode="outlined"
          style={[styles.filterButton, styles.muscleFilter]}
          contentStyle={styles.filterButtonContent}
          disabled
        >
          Muscle Filter
        </Button>
      </View>

      {/* Recent Exercises */}
      <View style={styles.exercisesSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Exercises
        </Text>
        
        <ScrollView 
          style={styles.exercisesList}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.map((exercise, index) => (
            <View key={exercise.id}>
              {renderExerciseRow(exercise)}
              {index < filteredExercises.length - 1 && (
                <Divider style={styles.exerciseDivider} />
              )}
            </View>
          ))}
        </ScrollView>
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
  exerciseImage: {
    marginRight: 16,
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
});