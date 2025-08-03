import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  useTheme,
  IconButton,
  TextInput,
  Checkbox,
  Divider,
  Menu,
  Avatar
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import type { WorkoutSession, Exercise, WorkoutSet, WorkoutStats } from '../../types/workout';
import { storageService } from '../../services/storage';
import { useMenuState } from '../../hooks/useMenuState';
import { formatDuration } from '../../utils/dateHelpers';
import { showConfirmation, showError } from '../../utils/alertUtils';
import { sharedStyles } from '../../utils/sharedStyles';
import { getExerciseImage, hasExerciseImage } from '../../utils/exerciseImages';
import { exerciseService } from '../../services/exerciseService';



export default function WorkoutSessionScreen({ route, navigation }: WorkoutScreenProps<'WorkoutSession'>) {
  const theme = useTheme();
  const { routineId, routineName, exercises } = route.params;

  // Timer state
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  
  // Exercise data for images
  const [exerciseImageMap, setExerciseImageMap] = useState<Map<string, string>>(new Map());

  // Workout state
  const [workoutData, setWorkoutData] = useState<WorkoutSession>({
    routineId,
    routineName,
    startTime,
    exercises: exercises.map((exercise, index) => ({
      id: `exercise-${index}`,
      name: exercise,
      sets: [{
        id: `set-1`,
        weight: '',
        reps: '',
        completed: false,
        previousWeight: '120',
        previousReps: '10'
      }],
      notes: ''
    }))
  });

  const menuState = useMenuState();

  // Handle finishing the workout
  const handleFinishWorkout = () => {
    showConfirmation({
      title: 'Finish Workout',
      message: 'Are you sure you want to finish this workout? This will save your progress and end the session.',
      confirmText: 'Finish',
      onConfirm: async () => {
        try {
          if (workoutData.id) {
            await storageService.completeWorkoutSession(workoutData.id);
          }
          navigation.goBack();
        } catch (error) {
          console.error('Error finishing workout:', error);
          showError('Failed to finish workout. Please try again.');
        }
      }
    });
  };

  // Set up header with Finish button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          mode="text"
          onPress={handleFinishWorkout}
          textColor="#FF3B30"
          labelStyle={{ fontSize: 17, fontWeight: '600' }}
        >
          Finish
        </Button>
      ),
    });
  }, [navigation, handleFinishWorkout]);

  // Load exercise image mapping
  useEffect(() => {
    const loadExerciseImages = async () => {
      try {
        const nameToIdMap = new Map<string, string>();
        
        // Get all exercises and create a mapping from name to ID
        for (const exerciseName of exercises) {
          const searchResults = await exerciseService.searchWorkoutExercises(exerciseName);
          // Find exact match (case insensitive)
          const exactMatch = searchResults.find(ex => 
            ex.name.toLowerCase() === exerciseName.toLowerCase()
          );
          
          if (exactMatch) {
            nameToIdMap.set(exerciseName, exactMatch.id);
          }
        }
        
        setExerciseImageMap(nameToIdMap);
      } catch (error) {
        console.error('Error loading exercise images:', error);
      }
    };

    loadExerciseImages();
  }, [exercises]);

  // Load existing session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        const existingSession = await storageService.getCurrentWorkoutSession(routineId);
        if (existingSession) {
          setWorkoutData({
            ...existingSession,
            startTime: new Date(existingSession.startTime)
          });
        }
      } catch (error) {
        console.error('Error loading existing session:', error);
      }
    };

    loadSession();
  }, [routineId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - workoutData.startTime.getTime()) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [workoutData.startTime]);

  // Auto-save workout data
  useEffect(() => {
    const saveSession = async () => {
      try {
        await storageService.saveWorkoutSession(workoutData);
      } catch (error) {
        console.error('Error saving workout session:', error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveSession, 1000);
    return () => clearTimeout(timeoutId);
  }, [workoutData]);

  // Calculate workout stats
  const calculateStats = (): WorkoutStats => {
    const totalSets = workoutData.exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(set => set.completed).length, 0
    );

    const totalVolume = workoutData.exercises.reduce((total, exercise) =>
      total + exercise.sets.reduce((exerciseTotal, set) => {
        if (set.completed && set.weight && set.reps) {
          return exerciseTotal + (parseFloat(set.weight) * parseFloat(set.reps));
        }
        return exerciseTotal;
      }, 0), 0
    );

    return {
      totalSets,
      totalVolume,
      duration
    };
  };

  const stats = calculateStats();

  // Render exercise image
  const renderExerciseImage = (exerciseName: string) => {
    const exerciseId = exerciseImageMap.get(exerciseName);
    
    if (exerciseId && hasExerciseImage(exerciseId)) {
      return (
        <Image
          source={getExerciseImage(exerciseId)}
          style={sharedStyles.circularImage}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <Avatar.Icon
        size={50}
        icon="dumbbell"
        style={{ margin: 0 }}
      />
    );
  };

  const handleAddSet = (exerciseId: string) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise =>
        exercise.id === exerciseId
          ? {
            ...exercise,
            sets: [...exercise.sets, {
              id: `set-${exercise.sets.length + 1}`,
              weight: '',
              reps: '',
              completed: false
            }]
          }
          : exercise
      )
    }));
  };

  const handleSetChange = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise =>
        exercise.id === exerciseId
          ? {
            ...exercise,
            sets: exercise.sets.map(set =>
              set.id === setId
                ? { ...set, [field]: value }
                : set
            )
          }
          : exercise
      )
    }));
  };

  const handleNotesChange = (exerciseId: string, notes: string) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise =>
        exercise.id === exerciseId
          ? { ...exercise, notes }
          : exercise
      )
    }));
  };

  const handleDeleteExercise = (exerciseId: string) => {
    const exercise = workoutData.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    showConfirmation({
      title: 'Delete Exercise',
      message: `Are you sure you want to delete "${exercise.name}"? This will remove all sets and data for this exercise.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => {
        setWorkoutData(prev => ({
          ...prev,
          exercises: prev.exercises.filter(e => e.id !== exerciseId)
        }));
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Fixed Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statItem}>
          <Text variant="bodySmall" style={styles.statLabel}>Duration</Text>
          <Text variant="titleMedium" style={styles.statValue}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="bodySmall" style={styles.statLabel}>Volume</Text>
          <Text variant="titleMedium" style={styles.statValue}>{Math.round(stats.totalVolume)}lbs</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="bodySmall" style={styles.statLabel}>Sets</Text>
          <Text variant="titleMedium" style={styles.statValue}>{stats.totalSets}</Text>
        </View>
      </View>

      {/* Scrollable Exercise List */}
      <ScrollView style={styles.exerciseList}>
        {workoutData.exercises.map((exercise) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <Card.Content>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <View style={sharedStyles.listItemContent}>
                  <View style={sharedStyles.imageContainer}>
                    {renderExerciseImage(exercise.name)}
                  </View>
                  <Title style={[styles.exerciseName, sharedStyles.flex1]}>{exercise.name}</Title>
                </View>
                <Menu
                  visible={menuState.isMenuOpen(exercise.id)}
                  onDismiss={menuState.closeMenu}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      onPress={() => menuState.openMenu(exercise.id)}
                      style={styles.optionsButton}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      menuState.closeMenu();
                      handleDeleteExercise(exercise.id);
                    }}
                    title="Delete Exercise"
                    leadingIcon="delete"
                  />
                </Menu>
              </View>

              {/* Notes Section */}
              <TextInput
                placeholder="Add notes here..."
                value={exercise.notes}
                onChangeText={(text) => handleNotesChange(exercise.id, text)}
                style={sharedStyles.notesInput}
                mode="flat"
                multiline
                numberOfLines={1}
                underlineStyle={{ height: 0 }}
                contentStyle={{ backgroundColor: 'transparent', paddingVertical: 8 }}
              />

              {/* Sets Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.setColumn]}>Set</Text>
                <Text style={[styles.tableHeaderText, styles.previousColumn]}>Previous</Text>
                <Text style={[styles.tableHeaderText, styles.weightColumn]}>LBs</Text>
                <Text style={[styles.tableHeaderText, styles.repsColumn]}>Reps</Text>
                <Text style={[styles.tableHeaderText, styles.checkColumn]}>✓</Text>
              </View>

              <Divider style={styles.tableDivider} />

              {/* Sets Table Rows */}
              {exercise.sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setCellText, styles.setColumn]}>{index + 1}</Text>

                  <View style={styles.previousColumn}>
                    {set.previousWeight && set.previousReps && (
                      <Text style={styles.previousText}>
                        {set.previousWeight}lb x {set.previousReps}
                      </Text>
                    )}
                  </View>

                  <TextInput
                    value={set.weight}
                    onChangeText={(text) => handleSetChange(exercise.id, set.id, 'weight', text)}
                    style={[sharedStyles.compactInput, styles.weightColumn]}
                    mode="flat"
                    keyboardType="numeric"
                    dense
                    underlineStyle={{ height: 0 }}
                    contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
                    placeholder="0"
                  />

                  <TextInput
                    value={set.reps}
                    onChangeText={(text) => handleSetChange(exercise.id, set.id, 'reps', text)}
                    style={[sharedStyles.compactInput, styles.repsColumn]}
                    mode="flat"
                    keyboardType="numeric"
                    dense
                    underlineStyle={{ height: 0 }}
                    contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
                    placeholder="0"
                  />

                  <View style={styles.checkColumn}>
                    <View style={[
                      styles.checkbox,
                      {
                        opacity: set.completed ? 1.0 : 0.6,
                      }
                    ]}>
                      <Checkbox
                        status="checked"
                        onPress={() => handleSetChange(exercise.id, set.id, 'completed', !set.completed)}
                        color={set.completed ? "#4CAF50" : "#9E9E9E"}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Add Set Button */}
              <Button
                mode="outlined"
                onPress={() => handleAddSet(exercise.id)}
                style={styles.addSetButton}
                icon="plus"
              >
                Add Set
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
  },
  statValue: {
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
    padding: 16,
  },
  exerciseCard: {
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '500',
  },
  optionsButton: {
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontWeight: '600',
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  tableDivider: {
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  setColumn: {
    width: 40,
    textAlign: 'center',
  },
  previousColumn: {
    width: 120,
    paddingHorizontal: 4,
  },
  weightColumn: {
    width: 60,
  },
  repsColumn: {
    width: 60,
  },
  checkColumn: {
    width: 40,
    alignItems: 'center',
  },
  setCellText: {
    textAlign: 'center',
  },
  previousText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },

  addSetButton: {
    marginTop: 12,
  },
  checkbox: {
    transform: [{ scale: 1.1 }], // Make it slightly larger for easier tapping
    borderRadius: 4,
    padding: 4,
  },
});