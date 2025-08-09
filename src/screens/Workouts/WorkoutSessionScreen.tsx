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
import type { WorkoutSession, WorkoutExercise, WorkoutSet, WorkoutStats, WorkoutRoutine, RoutineExercise } from '../../types/workout';
import { storageService } from '../../services/storage';
import { useMenuState } from '../../hooks/useMenuState';
import { formatDuration } from '../../utils/dateHelpers';
import { showConfirmation, showError } from '../../utils/alertUtils';
import { sharedStyles, spacing } from '../../utils/sharedStyles';
import { useToast } from '../../providers/ToastProvider';
import { getExerciseImage, hasExerciseImage } from '../../utils/exerciseImages';
import { exerciseService } from '../../services/exerciseService';
import { getPendingExercises, clearPendingExercises, setPendingExercises } from '../../utils/exerciseTransfer';

// --- PATCH: Add helpers at top-level scope ---
const getFinalSetValue = (value: string, placeholder?: string) => {
  if (value && value.trim() !== '') return value;
  if (placeholder && placeholder.trim() !== '') return placeholder;
  return '';
};

const getWorkoutDataWithPlaceholders = (data: WorkoutSession): WorkoutSession => {
  return {
    ...data,
    exercises: data.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(set => ({
        ...set,
        weight: getFinalSetValue(set.weight, set.previousWeight),
        reps: getFinalSetValue(set.reps, set.previousReps),
      }))
    }))
  };
};


export default function WorkoutSessionScreen({ route, navigation }: WorkoutScreenProps<'WorkoutSession'>) {
  const theme = useTheme();
  const toast = useToast();
  const { routineId, routineName, exercises } = route.params;

  // Timer state
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);

  // Exercise data for images
  const [exerciseImageMap, setExerciseImageMap] = useState<Map<string, string>>(new Map());

  // Track original set counts for detecting changes
  const [originalSetCounts, setOriginalSetCounts] = useState<Map<string, number>>(new Map());

  // Workout state
  const [workoutData, setWorkoutData] = useState<WorkoutSession>({
    routineId,
    routineName,
    startTime,
    exercises: []
  });

  const menuState = useMenuState();

  // Detect if any new exercises were added that are not in the original routine
  const hasNewExercisesAdded = (): boolean => {
    try {
      if (originalSetCounts.size === 0) return false; // No baseline to compare
      const originalNames = new Set(Array.from(originalSetCounts.keys()));
      return workoutData.exercises.some(ex => !originalNames.has(ex.name));
    } catch (error) {
      console.error('Error checking for new exercises:', error);
      return false;
    }
  };

  // Build pending exercises payload for CreateRoutine when coming from quick workout
  const buildPendingExercisesFromWorkout = async () => {
    const names = Array.from(new Set(workoutData.exercises.map(ex => ex.name)));
    const pending = await Promise.all(names.map(async (name) => {
      try {
        const results = await exerciseService.searchSelectableExercises(name);
        const exact = results.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (exact) {
          return { id: exact.id, name: exact.name, target: exact.target };
        }
        // Fallback to first result if available
        if (results.length > 0) {
          const first = results[0];
          return { id: first.id, name: name, target: first.target };
        }
      } catch (e) {
        // Ignore and use fallback
      }
      return { id: `custom-${name}`, name, target: 'Unknown' };
    }));
    return pending;
  };

  // Handle finishing the workout
  const handleFinishWorkout = () => {
    const runFinishFlow = async () => {
      try {
        const setCountChanges = hasSetCountChanges();
        const newExercisesAdded = hasNewExercisesAdded();

        // Quick workout: offer to create a routine
        if (route.params.routineId === 'empty') {
          showConfirmation({
            title: 'Create Routine?',
            message: 'Would you like to save these exercises as a routine for future workouts?\n\nYou can name it on the next screen.',
            confirmText: 'Create Routine',
            cancelText: 'Just Finish',
            onConfirm: async () => {
              try {
                const pending = await buildPendingExercisesFromWorkout();
                setPendingExercises(pending);
              } finally {
                await finishWorkoutSession();
                navigation.navigate('CreateRoutine');
              }
            },
            onCancel: async () => {
              await finishWorkoutSession();
            }
          });
          return;
        }

        // Existing routine: offer to update if set counts changed or exercises were added
        if (setCountChanges || newExercisesAdded) {
          const parts: string[] = [];
          if (setCountChanges) parts.push('set counts');
          if (newExercisesAdded) parts.push('exercises');
          const whatChanged = parts.join(' and ');

          showConfirmation({
            title: 'Update Routine?',
            message: `You changed ${whatChanged} during this workout. Would you like to update your routine template with these changes?`,
            confirmText: 'Update Routine',
            cancelText: 'Keep Original',
            onConfirm: async () => {
              try {
                await updateRoutineWithNewSetCounts();
                await finishWorkoutSession();
              } catch (error) {
                console.error('Error updating routine:', error);
                showError('Failed to update routine, but workout was saved.');
                await finishWorkoutSession();
              }
            },
            onCancel: async () => {
              await finishWorkoutSession();
            }
          });
        } else {
          // No structural changes, finish normally
          showConfirmation({
            title: 'Finish Workout',
            message: 'Are you sure you want to finish this workout? This will save your progress and end the session.',
            confirmText: 'Finish',
            onConfirm: finishWorkoutSession
          });
        }
      } catch (error) {
        console.error('Error in finish flow:', error);
        // Fallback to normal finish workflow
        showConfirmation({
          title: 'Finish Workout',
          message: 'Are you sure you want to finish this workout? This will save your progress and end the session.',
          confirmText: 'Finish',
          onConfirm: finishWorkoutSession
        });
      }
    };

    runFinishFlow();
  };

  // Helper function to complete the workout session
  const finishWorkoutSession = async () => {
    try {
      const dataToSave = getWorkoutDataWithPlaceholders(workoutData);
      if (dataToSave.id) {
        await storageService.completeWorkoutSession(dataToSave.id);
        toast.showSuccess('Workout completed successfully! 🎉');
      } else {
        // If no ID exists, save the session first to get one, then complete it
        // No workout ID found, saving session first
        const savedSession = await storageService.saveWorkoutSession(dataToSave);
        if (savedSession?.id) {
          await storageService.completeWorkoutSession(savedSession.id);
          toast.showSuccess('Workout completed successfully! 🎉');
        } else {
          // Failed to save workout session - no ID assigned
          showError('Failed to save workout session. Please try again.');
          return;
        }
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error finishing workout:', error);
      showError('Failed to finish workout. Please try again.');
    }
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
          const searchResults = await exerciseService.searchSelectableExercises(exerciseName);
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

  // Handle exercises added from AddExercise screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const pending = getPendingExercises();
      if (!pending) return;

      try {
        // Build WorkoutExercise objects with previous set data
        const newExercises = await Promise.all(
          pending.exercises.map(async (ex, index) => {
            const targetSets = originalSetCounts.get(ex.name) ?? 1;

            const sets: WorkoutSet[] = [];
            for (let setIdx = 0; setIdx < targetSets; setIdx++) {
              const previousSet = await getPreviousSetData(ex.name, setIdx);
              sets.push({
                id: `set-${setIdx + 1}`,
                weight: '',
                reps: '',
                completed: false,
                previousWeight: previousSet.weight,
                previousReps: previousSet.reps
              });
            }

            return {
              id: `exercise-${Date.now()}-${index}`,
              name: ex.name,
              timerSeconds: 0,
              sets,
              notes: ''
            } as WorkoutExercise;
          })
        );

        // Append to workout data
        setWorkoutData(prev => ({
          ...prev,
          exercises: [...prev.exercises, ...newExercises]
        }));

        // Update exercise image map for new exercises
        try {
          const updatedMap = new Map(exerciseImageMap);
          for (const ex of pending.exercises) {
            const searchResults = await exerciseService.searchSelectableExercises(ex.name);
            const exactMatch = searchResults.find(r => r.name.toLowerCase() === ex.name.toLowerCase());
            if (exactMatch) {
              updatedMap.set(ex.name, exactMatch.id);
            }
          }
          setExerciseImageMap(updatedMap);
        } catch (imgErr) {
          // Non-fatal; log and continue
          console.error('Error updating exercise images for added exercises:', imgErr);
        }
      } finally {
        clearPendingExercises();
      }
    });

    return unsubscribe;
  }, [navigation, originalSetCounts, exerciseImageMap]);

  // Function to get previous workout data for an exercise and set
  const getPreviousSetData = async (exerciseName: string, setIndex: number): Promise<{ weight?: string; reps?: string }> => {
    try {
      const allSessions = await storageService.getWorkoutSessions();

      // Find the most recent completed session that contains this exercise
      const completedSessions = allSessions
        .filter(session => session.completed && session.routineId === routineId)
        .sort((a, b) => {
          const bDate = new Date(b.completedAt ?? b.createdAt ?? 0);
          const aDate = new Date(a.completedAt ?? a.createdAt ?? 0);
          return bDate.getTime() - aDate.getTime();
        });

      for (const session of completedSessions) {
        const exercise = session.exercises?.find((ex: WorkoutExercise) => ex.name === exerciseName);
        if (exercise && exercise.sets?.[setIndex] && exercise.sets[setIndex].completed) {
          const previousSet = exercise.sets[setIndex];
          if (previousSet.weight && previousSet.reps) {
            return {
              weight: previousSet.weight,
              reps: previousSet.reps
            };
          }
        }
      }

      return {};
    } catch (error) {
      console.error('Error getting previous set data:', error);
      return {};
    }
  };

  // Load original set counts from the routine
  const loadOriginalSetCounts = async () => {
    try {
      const routines = await storageService.getWorkoutRoutines();
      const routine = routines.find((r: WorkoutRoutine) => r.id === routineId);
      
      if (routine) {
        const setCounts = new Map();
        
        // Handle RoutineExercise[] format with targetSets
        if (routine.exercises && routine.exercises.length > 0) {
          routine.exercises.forEach((exercise: RoutineExercise) => {
            setCounts.set(exercise.name, exercise.targetSets);
          });
        }
        
        setOriginalSetCounts(setCounts);
      }
    } catch (error) {
      console.error('Error loading original set counts:', error);
    }
  };

  // Check if set counts have changed compared to original routine
  const hasSetCountChanges = (): boolean => {
    try {
      // If no exercises or no original counts loaded, no changes
      if (workoutData.exercises.length === 0 || originalSetCounts.size === 0) {
        return false;
      }

      for (const exercise of workoutData.exercises) {
        const originalCount = originalSetCounts.get(exercise.name);
        const currentCount = exercise.sets.length;
        
        // Only consider it a change if we have an original count and it differs
        if (originalCount !== undefined && originalCount !== currentCount) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking set count changes:', error);
      return false; // Fail safely - no changes detected
    }
  };

  // Update the routine with new set counts
  const updateRoutineWithNewSetCounts = async (): Promise<void> => {
    try {
      const routines = await storageService.getWorkoutRoutines();
      const routineIndex = routines.findIndex((r: WorkoutRoutine) => r.id === routineId);
      
      if (routineIndex >= 0) {
        const routine = routines[routineIndex];
        
        // Merge existing routine exercises with any new exercises and updated set counts
        const currentCounts = new Map<string, number>();
        workoutData.exercises.forEach(ex => currentCounts.set(ex.name, ex.sets.length));

        const mergedMap = new Map<string, number>();
        // Start with existing routine
        routine.exercises.forEach(re => mergedMap.set(re.name, re.targetSets));
        // Overlay with current counts (adds new, updates existing)
        currentCounts.forEach((count, name) => mergedMap.set(name, count));

        const updatedExercises: RoutineExercise[] = Array.from(mergedMap.entries()).map(([name, targetSets]) => ({
          name,
          targetSets
        }));
        
        const updatedRoutine: WorkoutRoutine = {
          ...routine,
          exercises: updatedExercises,
          updatedAt: new Date()
        };
        
        await storageService.saveWorkoutRoutine(updatedRoutine);
      }
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  };

  // Load existing session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        const existingSession = await storageService.getCurrentWorkoutSession(routineId);
        if (existingSession) {
          setWorkoutData({
            ...existingSession,
            startTime: new Date(existingSession.startTime),
            exercises: (existingSession.exercises || []).map((ex: WorkoutExercise) => ({
              ...ex,
              timerSeconds: typeof ex.timerSeconds === 'number' ? ex.timerSeconds : 0,
            }))
          });

          // For existing sessions, get original set counts from the routine
          await loadOriginalSetCounts();
        } else {
          // If no existing session, initialize with exercises and previous workout data
          // Load the routine to get targetSets for each exercise
          let routine: WorkoutRoutine | undefined;
          try {
            const routines = await storageService.getWorkoutRoutines();
            routine = routines.find((r: WorkoutRoutine) => r.id === routineId);
          } catch (e) {
            routine = undefined;
          }

          const exercisesWithPreviousData = await Promise.all(
            exercises.map(async (exerciseName, exerciseIndex) => {
              // Find targetSets from routine definition
              let targetSets = 1;
              if (routine) {
                const routineExercise = routine.exercises.find(e => e.name === exerciseName);
                if (routineExercise && routineExercise.targetSets && routineExercise.targetSets > 0) {
                  targetSets = routineExercise.targetSets;
                }
              }
              // Build sets array
              const sets: WorkoutSet[] = [];
              for (let setIdx = 0; setIdx < targetSets; setIdx++) {
                const previousSet = await getPreviousSetData(exerciseName, setIdx);
                sets.push({
                  id: `set-${setIdx + 1}`,
                  weight: '',
                  reps: '',
                  completed: false,
                  previousWeight: previousSet.weight,
                  previousReps: previousSet.reps
                });
              }
              return {
                id: `exercise-${exerciseIndex}`,
                name: exerciseName,
                timerSeconds: 0,
                sets,
                notes: ''
              } as WorkoutExercise;
            })
          );

          setWorkoutData(prev => ({
            ...prev,
            exercises: exercisesWithPreviousData
          }));

          // Load original set counts from routine, fallback to current counts
          await loadOriginalSetCounts();
          
          // If no routine data found, use current set counts as original
          setTimeout(() => {
            if (originalSetCounts.size === 0) {
              const initialSetCounts = new Map();
              exercisesWithPreviousData.forEach(exercise => {
                initialSetCounts.set(exercise.name, exercise.sets.length);
              });
              setOriginalSetCounts(initialSetCounts);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error loading existing session:', error);
        // Fallback: initialize with basic exercise structure if loading fails
        const fallbackExercises: WorkoutExercise[] = exercises.map((exerciseName, exerciseIndex) => ({
          id: `exercise-${exerciseIndex}`,
          name: exerciseName,
          timerSeconds: 0,
          sets: [{
            id: `set-1`,
            weight: '',
            reps: '',
            completed: false,
            previousWeight: undefined,
            previousReps: undefined
          }],
          notes: ''
        }));

        setWorkoutData(prev => ({
          ...prev,
          exercises: fallbackExercises
        }));

        // Load original set counts for fallback case too
        await loadOriginalSetCounts();
      }
    };

    if (exercises.length > 0) {
      loadSession();
    }
  }, [routineId, exercises]);

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
        const dataToSave = getWorkoutDataWithPlaceholders(workoutData);
        const savedSession = await storageService.saveWorkoutSession(dataToSave);
        
        // Update workoutData with the ID if it was just assigned
        if (!workoutData.id && savedSession?.id) {
          setWorkoutData(prev => ({
            ...prev,
            id: savedSession.id
          }));
        }
      } catch (error) {
        console.error('Error saving workout session:', error);
      }
    };

    // Only auto-save if we have exercises (avoid saving empty initial state)
    if (workoutData.exercises.length > 0) {
      const timeoutId = setTimeout(saveSession, 1000);
      return () => clearTimeout(timeoutId);
    }
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

  const handleAddSet = async (exerciseId: string) => {
    const exercise = workoutData.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newSetIndex = exercise.sets.length;
    const previousSetData = await getPreviousSetData(exercise.name, newSetIndex);

    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? {
            ...ex,
            sets: [...ex.sets, {
              id: `set-${ex.sets.length + 1}`,
              weight: '',
              reps: '',
              completed: false,
              previousWeight: previousSetData.weight,
              previousReps: previousSetData.reps
            }]
          }
          : ex
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
        {workoutData.exercises.length === 0 ? (
          <View style={sharedStyles.emptyState}>
            <IconButton
              icon="dumbbell"
              size={60}
              iconColor={theme.colors.primary}
              style={sharedStyles.emptyIcon}
            />
            <Text variant="bodyLarge" style={[sharedStyles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Add an exercise to start your workout
            </Text>
          </View>
        ) : (
          workoutData.exercises.map((exercise) => (
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
                      placeholder={set.previousWeight ?? '0'}
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
                      placeholder={set.previousReps ?? '0'}
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
          ))
        )}

        {/* Add Exercise Button at end of content */}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AddExercise')}
          style={styles.addExerciseButton}
          contentStyle={styles.addExerciseButtonContent}
        >
          Add Exercise
        </Button>
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl, // normal bottom padding
  },
  addExerciseButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  addExerciseButtonContent: {
    paddingVertical: 8,
  },
  exerciseCard: {
    marginBottom: spacing.lg,
  },
  exerciseHeader: {
    ...sharedStyles.headerRow,
    marginBottom: 0, // Override default marginBottom for this use case
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '500',
  },
  optionsButton: {
    marginLeft: -22,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
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