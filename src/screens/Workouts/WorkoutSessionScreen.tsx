import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import {
  Card,
  Text,
  Button,
  useTheme,
  TextInput,
  Checkbox,
  Divider,
  Avatar
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import type { WorkoutSession, WorkoutExercise, WorkoutSet, WorkoutStats, WorkoutRoutine } from '../../types/workout';
import { storageService } from '../../services/storage';
import { formatDuration } from '../../utils/dateHelpers';
import { showConfirmation, showError } from '../../utils/alertUtils';
import { sharedStyles, spacing } from '../../utils/sharedStyles';
import { useToast } from '../../providers/ToastProvider';
import { getExerciseImage, hasExerciseImage } from '../../utils/exerciseImages';
import { exerciseService } from '../../services/exerciseService';
import { getPendingExercises, clearPendingExercises, setPendingExercises } from '../../utils/exerciseTransfer';
import { handleError, ErrorMessages } from '../../utils/errorHandler';
import { COLORS } from '../../utils/constants';
import ExerciseList from '../../components/ExerciseList';
import ExerciseHeader from '../../components/ExerciseHeader';
import HeaderButton from '../../components/HeaderButton';

// Pure utility functions for common patterns
const getExerciseNames = (exercises: WorkoutExercise[]) => exercises.map(ex => ex.name);

const createWorkoutSet = (
  index: number,
  isCardio: boolean,
  previousData?: { weight?: string; reps?: string; duration?: string; distance?: string }
): WorkoutSet => ({
  id: `set-${index + 1}`,
  weight: '',
  reps: '',
  duration: '',
  distance: '',
  completed: false,
  previousWeight: previousData?.weight,
  previousReps: previousData?.reps,
  previousDuration: previousData?.duration,
  previousDistance: previousData?.distance
});

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

// Fetch exercise id by exact name match (case-insensitive)
const fetchExerciseIdByName = async (exerciseName: string): Promise<string | undefined> => {
  try {
    const results = await exerciseService.searchSelectableExercises(exerciseName);
    const exact = results.find(r => r.name.toLowerCase() === exerciseName.toLowerCase());
    return exact?.id;
  } catch (error) {
    handleError(error, ErrorMessages.LOAD_DATA, { context: 'Fetch exercise ID', showAlert: false });
    return undefined;
  }
};

// Build sets array prefilled with previous workout data when available
// defined after getPreviousSetData

// (buildSetsWithPrevious declared later, after getPreviousSetData)


function WorkoutSessionScreen({ route, navigation }: WorkoutScreenProps<'WorkoutSession'>) {
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

  // State update utility function
  const updateExerciseInWorkout = (
    exerciseId: string,
    updater: (exercise: WorkoutExercise) => WorkoutExercise
  ) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise =>
        exercise.id === exerciseId ? updater(exercise) : exercise
      )
    }));
  };

  // Routine update utility function
  const updateRoutineExercise = async (
    exerciseName: string,
    updater: (exercise: WorkoutExercise) => WorkoutExercise
  ) => {
    try {
      const routines = await storageService.getWorkoutRoutines();
      const routineIndex = routines.findIndex((r: WorkoutRoutine) => r.id === routineId);

      if (routineIndex >= 0) {
        const routine = routines[routineIndex];
        const exerciseIndex = routine.exercises.findIndex(e => e.name === exerciseName);

        if (exerciseIndex >= 0) {
          const updatedRoutine = { ...routine };
          updatedRoutine.exercises[exerciseIndex] = updater(routine.exercises[exerciseIndex]);
          updatedRoutine.updatedAt = new Date();

          await storageService.saveWorkoutRoutine(updatedRoutine);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating routine exercise:', error);
      return false;
    }
  };

  // menu state no longer needed; ExerciseHeader manages its own menu

  // Detect if any new exercises were added that are not in the original routine
  const hasNewExercisesAdded = (): boolean => {
    try {
      if (originalSetCounts.size === 0) return false; // No baseline to compare
      const originalNames = new Set(Array.from(originalSetCounts.keys()));
      const currentNames = new Set(getExerciseNames(workoutData.exercises));
      return Array.from(currentNames).some(name => !originalNames.has(name));
    } catch (error) {
      console.error('Error checking for new exercises:', error);
      return false;
    }
  };

  // Detect if any exercises that were in the original routine were removed in this session
  const hasExercisesRemoved = (): boolean => {
    try {
      if (originalSetCounts.size === 0) return false; // No baseline to compare
      const currentNames = new Set(workoutData.exercises.map(ex => ex.name));
      for (const originalName of Array.from(originalSetCounts.keys())) {
        if (!currentNames.has(originalName)) return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking for removed exercises:', error);
      return false;
    }
  };

  // Build pending exercises payload for CreateRoutine when coming from quick workout
  const buildPendingExercisesFromWorkout = async () => {
    const names = Array.from(new Set(getExerciseNames(workoutData.exercises)));
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

  // Helper function to complete the workout session
  const finishWorkoutSession = useCallback(async () => {
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
  }, [workoutData, toast, navigation]);

  // Handle finishing the workout
  const handleFinishWorkout = useCallback(() => {
    const runFinishFlow = async () => {
      try {
        const setCountChanges = hasSetCountChanges();
        const newExercisesAdded = hasNewExercisesAdded();
        const exercisesRemoved = hasExercisesRemoved();

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

        // Existing routine: offer to update if structural changes occurred
        if (hasStructuralChanges) {
          showConfirmation({
            title: 'Update Routine?',
            message: 'You added or removed exercises/sets during this workout. Would you like to update your routine template with these changes?',
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
  }, [route.params.routineId, hasStructuralChanges, workoutData, finishWorkoutSession, navigation]);

  // Set up header with Finish button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          mode="text"
          onPress={handleFinishWorkout}
          textColor={COLORS.ERROR}
          fontSize={17}
          fontWeight="600"
        >
          Finish
        </HeaderButton>
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
          const id = await fetchExerciseIdByName(exerciseName);
          if (id) nameToIdMap.set(exerciseName, id);
        }

        setExerciseImageMap(nameToIdMap);
      } catch (error) {
        handleError(error, ErrorMessages.LOAD_DATA, { context: 'Load exercise images', showAlert: false });
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
        // Build WorkoutExercise objects with previous set data, skipping duplicates
        const newExercises = await Promise.all(
          pending.exercises.map(async (ex, index) => {
            const targetSets = originalSetCounts.get(ex.name) ?? 1;
            // Prevent duplicates by name
            const alreadyExists = workoutData.exercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase());
            if (alreadyExists) return null;

            // Determine if exercise is cardio
            const exerciseId = await fetchExerciseIdByName(ex.name);
            const isCardio = exerciseId ? await exerciseService.isCardioExercise(exerciseId) : false;

            const sets = await buildSetsWithPrevious(ex.name, targetSets, isCardio);

            return {
              id: `exercise-${Date.now()}-${index}`,
              name: ex.name,
              exerciseType: isCardio ? 'cardio' as const : 'strength' as const,
              catalogExerciseId: exerciseId,
              timerSeconds: 0,
              sets,
              notes: ''
            } as WorkoutExercise;
          })
        );

        // Filter out nulls (duplicates) and append to workout data
        const filtered = newExercises.filter(Boolean) as WorkoutExercise[];
        if (filtered.length > 0) {
          setWorkoutData(prev => ({
            ...prev,
            exercises: [...prev.exercises, ...filtered]
          }));
          // Mark that structural changes have occurred (new exercises added)
          setHasStructuralChanges(true);
        }

        // Update exercise image map for new exercises
        try {
          const updatedMap = new Map(exerciseImageMap);
          for (const ex of pending.exercises) {
            // Skip duplicates when updating images
            const exists = workoutData.exercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase());
            if (exists) continue;
            const id = await fetchExerciseIdByName(ex.name);
            if (id) updatedMap.set(ex.name, id);
          }
          setExerciseImageMap(updatedMap);
        } catch (imgErr) {
          // Non-fatal; log and continue
          handleError(imgErr, ErrorMessages.LOAD_DATA, { context: 'Update images for added exercises', showAlert: false });
        }
      } finally {
        clearPendingExercises();
      }

      // Do not prompt here; prompting happens on Finish only
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
      handleError(error, ErrorMessages.LOAD_DATA, { context: 'Get previous set data', showAlert: false });
      return {};
    }
  };

  // Build sets array prefilled with previous workout data when available
  const buildSetsWithPrevious = async (exerciseName: string, targetSets: number, isCardio: boolean = false): Promise<WorkoutSet[]> => {
    const sets: WorkoutSet[] = [];
    for (let setIdx = 0; setIdx < targetSets; setIdx++) {
      const previousSet = await getPreviousSetData(exerciseName, setIdx);
      sets.push(createWorkoutSet(setIdx + 1, isCardio, previousSet));
    }
    return sets;
  };

  // Load original set counts from the routine
  const loadOriginalSetCounts = async () => {
    try {
      const routines = await storageService.getWorkoutRoutines();
      const routine = routines.find((r: WorkoutRoutine) => r.id === routineId);

      if (routine) {
        const setCounts = new Map();

        // Handle WorkoutExercise[] format with sets array
        if (routine.exercises && routine.exercises.length > 0) {
          routine.exercises.forEach((exercise) => {
            setCounts.set(exercise.name, exercise.sets.length);
          });
        }

        setOriginalSetCounts(setCounts);
      }
    } catch (error) {
      handleError(error, ErrorMessages.LOAD_DATA, { context: 'Load original set counts', showAlert: false });
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
      handleError(error, ErrorMessages.GENERIC, { context: 'Check set count changes', showAlert: false });
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

        // Create updated exercises based on current workout data
        const updatedExercises: WorkoutExercise[] = workoutData.exercises.map(exercise => {
          // Find the corresponding routine exercise to preserve any existing data
          const routineExercise = routine.exercises.find(re => re.name === exercise.name);

          return {
            id: `routine-${exercise.name}-${Date.now()}`, // Generate new ID for routine exercise
            name: exercise.name,
            timerSeconds: 0, // Routines don't need timer
            sets: exercise.sets.map((set, index) => ({
              id: `set-${index + 1}`,
              weight: set.weight || '', // Preserve actual workout weight
              reps: set.reps || '', // Preserve actual workout reps
              completed: false // Routines don't track completion
            })),
            notes: exercise.notes || routineExercise?.notes || '' // Preserve workout notes or fallback to routine notes
          };
        });

        // Add any new exercises that weren't in the original routine
        const existingNames = new Set(getExerciseNames(workoutData.exercises));
        const newExercises = exercises.filter(name => !existingNames.has(name));

        if (newExercises.length > 0) {
          newExercises.forEach(exerciseName => {
            const workoutExercise = workoutData.exercises.find(ex => ex.name === exerciseName);
            if (workoutExercise) {
              updatedExercises.push({
                id: `routine-${exerciseName}-${Date.now()}`,
                name: exerciseName,
                timerSeconds: 0,
                sets: workoutExercise.sets.map((set, index) => ({
                  id: `set-${index + 1}`,
                  weight: set.weight || '',
                  reps: set.reps || '',
                  completed: false
                })),
                notes: workoutExercise.notes || ''
              });
            }
          });
        }

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
          // Migrate existing exercises to add exerciseType if missing
          const migratedExercises = await Promise.all(
            (existingSession.exercises || []).map(async (ex: WorkoutExercise) => {
              // If exerciseType already exists, use it
              if (ex.exerciseType) {
                return {
                  ...ex,
                  timerSeconds: typeof ex.timerSeconds === 'number' ? ex.timerSeconds : 0,
                };
              }
              
              // Otherwise, detect it
              const exerciseId = ex.catalogExerciseId || await fetchExerciseIdByName(ex.name);
              const isCardio = exerciseId ? await exerciseService.isCardioExercise(exerciseId) : false;
              
              return {
                ...ex,
                exerciseType: isCardio ? 'cardio' as const : 'strength' as const,
                catalogExerciseId: exerciseId,
                timerSeconds: typeof ex.timerSeconds === 'number' ? ex.timerSeconds : 0,
              };
            })
          );
          
          setWorkoutData({
            ...existingSession,
            startTime: new Date(existingSession.startTime),
            exercises: migratedExercises
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
              // Determine if exercise is cardio
              const exerciseId = await fetchExerciseIdByName(exerciseName);
              const isCardio = exerciseId ? await exerciseService.isCardioExercise(exerciseId) : false;
              
              // Find routine exercise to get planned sets
              let plannedSets: WorkoutSet[] = [];
              if (routine) {
                const routineExercise = routine.exercises.find(e => e.name === exerciseName);
                if (routineExercise && routineExercise.sets.length > 0) {
                  // Use the planned sets from the routine as a starting point
                  plannedSets = routineExercise.sets.map(set => ({
                    id: set.id,
                    weight: set.weight || '',
                    reps: set.reps || '',
                    duration: set.duration || '',
                    distance: set.distance || '',
                    completed: false,
                    previousWeight: undefined, // Will be filled by buildSetsWithPrevious
                    previousReps: undefined,
                    previousDuration: undefined,
                    previousDistance: undefined
                  }));
                }
              }

              // If no planned sets, create default sets
              if (plannedSets.length === 0) {
                plannedSets = [createWorkoutSet(1, isCardio)];
              }

              // Build sets array with previous workout data, using planned sets as base
              const sets = await Promise.all(plannedSets.map(async (plannedSet, setIndex) => {
                const previousSet = await getPreviousSetData(exerciseName, setIndex);
                return {
                  ...plannedSet,
                  id: `set-${setIndex + 1}`,
                  previousWeight: previousSet.weight,
                  previousReps: previousSet.reps,
                  previousDuration: previousSet.duration,
                  previousDistance: previousSet.distance
                };
              }));

              return {
                id: `exercise-${exerciseIndex}`,
                name: exerciseName,
                exerciseType: isCardio ? 'cardio' as const : 'strength' as const,
                catalogExerciseId: exerciseId,
                timerSeconds: 0,
                sets,
                notes: routine?.exercises.find(e => e.name === exerciseName)?.notes || ''
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
        handleError(error, ErrorMessages.LOAD_DATA, { context: 'Load existing workout session', showAlert: false });
        // Fallback: initialize with basic exercise structure if loading fails
        const fallbackExercises: WorkoutExercise[] = exercises.map((exerciseName, exerciseIndex) => ({
          id: `exercise-${exerciseIndex}`,
          name: exerciseName,
          timerSeconds: 0,
          sets: [createWorkoutSet(1)],
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
        handleError(error, ErrorMessages.SAVE_DATA, { context: 'Auto-save workout session', showAlert: false });
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

  // Track if structural changes (adding/removing sets) have occurred
  const [hasStructuralChanges, setHasStructuralChanges] = useState(false);

  // Auto-update routine when weight/reps change on existing sets
  const autoUpdateRoutine = async (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'duration' | 'distance', value: string) => {
    try {
      // Only auto-update if this is a weight/reps/duration/distance change on an existing set
      if (field === 'weight' || field === 'reps' || field === 'duration' || field === 'distance') {
        const exercise = workoutData.exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        const set = exercise.sets.find(s => s.id === setId);
        if (!set) return;

        // Check if this set index exists in the original routine
        const setIndex = exercise.sets.findIndex(s => s.id === setId);
        if (setIndex < 0) return;

        // Use the utility function to update the routine
        await updateRoutineExercise(exercise.name, (routineExercise) => {
          if (routineExercise.sets[setIndex]) {
            const updatedExercise = { ...routineExercise };
            const updatedSet = { ...updatedExercise.sets[setIndex] };
            updatedSet[field] = value;
            updatedExercise.sets[setIndex] = updatedSet;
            return updatedExercise;
          }
          return routineExercise;
        });

        console.log(`Auto-updated routine: ${exercise.name} set ${setIndex + 1} ${field} = ${value}`);
      }
    } catch (error) {
      // Non-fatal error - log but don't interrupt user experience
      console.error('Error auto-updating routine:', error);
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    const exercise = workoutData.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newSetIndex = exercise.sets.length;
    const previousSetData = await getPreviousSetData(exercise.name, newSetIndex);
    const isCardio = exercise.exerciseType === 'cardio';

    updateExerciseInWorkout(exerciseId, (ex) => ({
      ...ex,
      sets: [...ex.sets, createWorkoutSet(ex.sets.length + 1, isCardio, previousSetData)]
    }));

    // Mark that structural changes have occurred
    setHasStructuralChanges(true);
  };

  const handleSetChange = async (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'duration' | 'distance' | 'completed', value: string | boolean) => {
    updateExerciseInWorkout(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map(set =>
        set.id === setId
          ? { ...set, [field]: value }
          : set
      )
    }));

    // Auto-update routine for weight/reps/duration/distance changes on existing sets
    if (field === 'weight' || field === 'reps' || field === 'duration' || field === 'distance') {
      await autoUpdateRoutine(exerciseId, setId, field, value as string);
    }
  };

  const handleNotesChange = async (exerciseId: string, notes: string) => {
    updateExerciseInWorkout(exerciseId, (exercise) => ({ ...exercise, notes }));

    // Auto-update routine with new notes
    const exercise = workoutData.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      await updateRoutineExercise(exercise.name, (routineExercise) => ({
        ...routineExercise,
        notes
      }));
      console.log(`Auto-updated routine: ${exercise.name} notes = ${notes}`);
    }
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
        // Mark that structural changes have occurred
        setHasStructuralChanges(true);
        // Nudge: let user know routine can be updated at finish
        toast.showInfo('Exercise removed. You can update the routine when finishing.');
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
      <ExerciseList
        items={workoutData.exercises}
        keyExtractor={(ex: WorkoutExercise) => ex.id}
        emptyTitle="Add an exercise to start your workout"
        renderItem={(exercise: WorkoutExercise) => (
          <Card style={styles.exerciseCard}>
            <Card.Content>
              {/* Exercise Header with inline notes */}
              <ExerciseHeader
                title={exercise.name}
                left={renderExerciseImage(exercise.name)}
                menuItems={[
                  {
                    title: 'Delete Exercise',
                    icon: 'delete',
                    onPress: () => handleDeleteExercise(exercise.id),
                  },
                ]}
                notesValue={exercise.notes}
                notesPlaceholder={'Add notes here...'}
                notesEditable={true}
                onNotesChange={(text) => handleNotesChange(exercise.id, text)}
              />

              {/* Notes now handled by ExerciseHeader */}

              {/* Sets Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.setColumn]}>Set</Text>
                <Text style={[styles.tableHeaderText, styles.previousColumn]}>Previous</Text>
                {exercise.exerciseType === 'cardio' ? (
                  <>
                    <Text style={[styles.tableHeaderText, styles.weightColumn]}>Min</Text>
                    <Text style={[styles.tableHeaderText, styles.repsColumn]}>Miles</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.tableHeaderText, styles.weightColumn]}>LBs</Text>
                    <Text style={[styles.tableHeaderText, styles.repsColumn]}>Reps</Text>
                  </>
                )}
                <Text style={[styles.tableHeaderText, styles.checkColumn]}>✓</Text>
              </View>

              <Divider style={styles.tableDivider} />

              {/* Sets Table Rows */}
              {exercise.sets.map((set: WorkoutSet, index: number) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setCellText, styles.setColumn]}>{index + 1}</Text>

                  <View style={styles.previousColumn}>
                    {exercise.exerciseType === 'cardio' ? (
                      set.previousDuration && set.previousDistance && (
                        <Text style={styles.previousText}>
                          {set.previousDuration}m / {set.previousDistance}mi
                        </Text>
                      )
                    ) : (
                      set.previousWeight && set.previousReps && (
                        <Text style={styles.previousText}>
                          {set.previousWeight}lb x {set.previousReps}
                        </Text>
                      )
                    )}
                  </View>

                  {exercise.exerciseType === 'cardio' ? (
                    <>
                      <TextInput
                        value={set.duration || ''}
                        onChangeText={(text) => handleSetChange(exercise.id, set.id, 'duration', text)}
                        style={[sharedStyles.compactInput, styles.weightColumn]}
                        mode="flat"
                        keyboardType="numeric"
                        dense
                        underlineStyle={{ height: 0 }}
                        contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
                        placeholder={set.previousDuration ?? '0'}
                      />
                      <TextInput
                        value={set.distance || ''}
                        onChangeText={(text) => handleSetChange(exercise.id, set.id, 'distance', text)}
                        style={[sharedStyles.compactInput, styles.repsColumn]}
                        mode="flat"
                        keyboardType="decimal-pad"
                        dense
                        underlineStyle={{ height: 0 }}
                        contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
                        placeholder={set.previousDistance ?? '0'}
                      />
                    </>
                  ) : (
                    <>
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
                    </>
                  )}

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
                        color={set.completed ? COLORS.SUCCESS : COLORS.GRAY_MEDIUM}
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
        )}
        footer={(
          <Button
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('AddExercise')}
            style={styles.addExerciseButton}
            contentStyle={styles.addExerciseButtonContent}
          >
            Add Exercise
          </Button>
        )}
      />
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
    shadowColor: COLORS.SHADOW,
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

export default WorkoutSessionScreen;