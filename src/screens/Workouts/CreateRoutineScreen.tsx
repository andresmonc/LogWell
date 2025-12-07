import React, { useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
    Text,
    TextInput,
    Button,
    useTheme,
    IconButton
} from 'react-native-paper';

import type { WorkoutScreenProps } from '../../types/navigation';
import type { WorkoutRoutine, WorkoutExercise, WorkoutSet } from '../../types/workout';
import { storageService } from '../../services/storage';
import { showError } from '../../utils/alertUtils';
import { handleError, ErrorMessages, showSuccess, showWarning } from '../../utils/errorHandler';
import { sharedStyles } from '../../utils/sharedStyles';
import { ExerciseCard } from '../../components';
import ExerciseList from '../../components/ExerciseList';
import { getPendingExercises, clearPendingExercises } from '../../utils/exerciseTransfer';

type Exercise = WorkoutExercise & {
    target: string;
};

function CreateRoutineScreen({ navigation, route }: WorkoutScreenProps<'CreateRoutine'>) {
    const theme = useTheme();
    
CreateRoutineScreen.displayName = 'CreateRoutineScreen';
    const editRoutine = route.params?.editRoutine;
    const isEditMode = !!editRoutine;
    
    const [routineTitle, setRoutineTitle] = useState(editRoutine?.name || '');
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

    // Initialize form data when editing
    useEffect(() => {
        if (isEditMode && editRoutine) {
            // Convert exercise names to exercise objects
            const exerciseObjects = editRoutine.exercises.map((exerciseName, index) => ({
                id: `edit-exercise-${editRoutine.id}-${index}`, // Unique ID for edited exercises
                name: exerciseName,
                target: 'Unknown', // We don't have target info when editing
                notes: '',
                timerSeconds: 0,
                sets: []
            }));
            setSelectedExercises(exerciseObjects);
        }
    }, [isEditMode, editRoutine]);

    // Handle exercises passed from AddExerciseScreen
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Check for pending exercises when screen comes into focus
            const pending = getPendingExercises();
            if (!pending) return;

            const incoming = pending.exercises.map(exercise => ({
                ...exercise,
                notes: '',
                timerSeconds: 0,
                sets: [] as WorkoutSet[], // Start with no sets, user can add them for planning
            }));

            // Prevent duplicates by name (case-insensitive), including duplicates within the incoming list
            const existingNames = new Set(selectedExercises.map(ex => ex.name.toLowerCase()));
            const seenIncoming = new Set<string>();
            const duplicatesSkipped: string[] = [];

            const uniqueIncoming = incoming.filter(ex => {
                const nameKey = ex.name.toLowerCase();
                if (existingNames.has(nameKey) || seenIncoming.has(nameKey)) {
                    duplicatesSkipped.push(ex.name);
                    return false;
                }
                seenIncoming.add(nameKey);
                return true;
            });

            if (uniqueIncoming.length > 0) {
                setSelectedExercises(prev => [...prev, ...uniqueIncoming]);
            }

            if (duplicatesSkipped.length > 0) {
                const list = Array.from(new Set(duplicatesSkipped)).slice(0, 3).join(', ');
                const more = duplicatesSkipped.length > 3 ? ` and ${duplicatesSkipped.length - 3} more` : '';
                showWarning(`Skipped duplicate exercise(s): ${list}${more}`);
            }

            // Clear the pending exercises
            clearPendingExercises();
        });

        return unsubscribe;
    }, [navigation, selectedExercises]);

    // Define all handlers first
    const handleNotesChange = useCallback((exerciseId: string, notes: string) => {
        setSelectedExercises(prev => 
            prev.map(exercise => 
                exercise.id === exerciseId ? { ...exercise, notes } : exercise
            )
        );
    }, []);

    const handleSetChange = useCallback((exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
        setSelectedExercises(prev => 
            prev.map(exercise => 
                exercise.id === exerciseId 
                    ? {
                        ...exercise,
                        sets: exercise.sets?.map(set => 
                            set.id === setId ? { ...set, [field]: value } : set
                        ) || []
                    }
                    : exercise
            )
        );
    }, []);

    const handleAddSet = useCallback((exerciseId: string) => {
        setSelectedExercises(prev => 
            prev.map(exercise => 
                exercise.id === exerciseId 
                    ? {
                        ...exercise,
                        sets: [
                            ...(exercise.sets || []),
                            {
                                id: `set-${(exercise.sets?.length || 0) + 1}`,
                                weight: '',
                                reps: '',
                                completed: false
                            }
                        ]
                    }
                    : exercise
            )
        );
    }, []);

    const handleDeleteExercise = useCallback((exerciseId: string) => {
        setSelectedExercises(prev => prev.filter(exercise => exercise.id !== exerciseId));
    }, []);

    const handleSave = useCallback(async () => {
        try {
            // Ensure unique exercise names before saving
            const uniqueByName: Exercise[] = [];
            const seenNames = new Set<string>();
            let duplicatesRemoved = 0;
            for (const ex of selectedExercises) {
                const key = ex.name.toLowerCase();
                if (seenNames.has(key)) {
                    duplicatesRemoved++;
                    continue;
                }
                seenNames.add(key);
                uniqueByName.push(ex);
            }
            if (duplicatesRemoved > 0) {
                showWarning(`Removed ${duplicatesRemoved} duplicate exercise(s) before saving`);
            }

            if (isEditMode && editRoutine) {
                // Get the original routine to preserve creation date
                const originalRoutines = await storageService.getWorkoutRoutines();
                const originalRoutine = originalRoutines.find(r => r.id === editRoutine.id);
                
                // Update existing routine
                const updatedRoutine: WorkoutRoutine = {
                    id: editRoutine.id,
                    name: routineTitle.trim(),
                    exercises: uniqueByName.map(exercise => ({
                        id: exercise.id,
                        name: exercise.name,
                        timerSeconds: 0, // Routines don't need timer
                        sets: exercise.sets.map(set => ({
                            id: set.id,
                            weight: set.weight || '', // Preserve planned weight
                            reps: set.reps || '', // Preserve planned reps
                            completed: false, // Routines don't track completion
                            previousWeight: undefined, // No previous data in routines
                            previousReps: undefined
                        })),
                        notes: exercise.notes
                    })),
                    createdAt: originalRoutine?.createdAt || new Date(), // Preserve original creation date
                    updatedAt: new Date()
                };

                await storageService.saveWorkoutRoutine(updatedRoutine);
                showSuccess('Routine updated successfully!');
            } else {
                // Create new routine
                const newRoutine: WorkoutRoutine = {
                    id: `routine_${Date.now()}`, // Simple ID generation
                    name: routineTitle.trim(),
                    exercises: uniqueByName.map(exercise => ({
                        id: exercise.id,
                        name: exercise.name,
                        timerSeconds: 0, // Routines don't need timer
                        sets: exercise.sets.map(set => ({
                            id: set.id,
                            weight: set.weight || '', // Preserve planned weight
                            reps: set.reps || '', // Preserve planned reps
                            completed: false, // Routines don't track completion
                            previousWeight: undefined, // No previous data in routines
                            previousReps: undefined
                        })),
                        notes: exercise.notes
                    })),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await storageService.saveWorkoutRoutine(newRoutine);
                showSuccess(isEditMode ? 'Routine updated successfully!' : 'Routine created successfully!');
            }
            
            navigation.goBack();
        } catch (error) {
            const message = isEditMode ? 'Failed to update routine. Please try again.' : 'Failed to create routine. Please try again.';
            handleError(error, message, { context: 'Save routine' });
        }
    }, [selectedExercises, routineTitle, navigation, isEditMode, editRoutine]);

    // Now set up navigation options with proper handleSave reference
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <Button
                    mode="text"
                    onPress={() => {
                        // Navigate back to WorkoutHome and clear any stacked CreateRoutine screens
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'WorkoutHome' }],
                        });
                    }}
                    textColor={theme.colors.onSurface}
                >
                    Cancel
                </Button>
            ),
            headerRight: () => (
                <Button
                    mode="contained"
                    onPress={handleSave}
                    disabled={!routineTitle.trim()}
                    style={sharedStyles.headerButton}
                    contentStyle={sharedStyles.headerButtonContent}
                >
                    Save
                </Button>
            ),
            headerTitle: isEditMode ? 'Edit Routine' : 'Create Routine',
            headerTitleAlign: 'center',
        });
    }, [navigation, routineTitle, theme, handleSave, isEditMode]); // Added isEditMode for header title

    return (
        <View style={[sharedStyles.container, { backgroundColor: theme.colors.background }]}>
            {/* Routine Title Input */}
            <View style={sharedStyles.searchSection}>
                <TextInput
                    placeholder="Enter routine title..."
                    value={routineTitle}
                    onChangeText={setRoutineTitle}
                    mode="flat"
                    style={sharedStyles.subtleInput}
                    underlineStyle={{ height: 0 }}
                    contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 12 }}
                />
            </View>

            {/* Exercises List */}
            <ExerciseList
              items={selectedExercises}
              keyExtractor={(ex) => ex.id}
              emptyTitle="Get started by adding exercises to your routine"
              renderItem={(exercise) => (
                <ExerciseCard
                  exercise={exercise}
                  onNotesChange={handleNotesChange}
                  onSetChange={handleSetChange}
                  onAddSet={handleAddSet}
                  onDeleteExercise={handleDeleteExercise}
                  showSets={true}
                  editable={true}
                />
              )}
              footer={(
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('AddExercise')}
                  icon="plus"
                  style={styles.addExerciseButton}
                  contentStyle={styles.addExerciseButtonContent}
                >
                  {selectedExercises.length > 0 ? 'Add More Exercises' : 'Add Exercise'}
                </Button>
              )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // Only keeping styles unique to this screen
    addExerciseButton: {
        marginVertical: 24,
    },
    addExerciseButtonContent: {
        paddingVertical: 8,
    },
});

export default CreateRoutineScreen;