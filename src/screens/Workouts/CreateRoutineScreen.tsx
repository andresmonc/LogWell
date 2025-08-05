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
import type { WorkoutRoutine, RoutineExercise } from '../../types/workout';
import { storageService } from '../../services/storage';
import { showError, showSuccess } from '../../utils/alertUtils';
import { handleError, ErrorMessages } from '../../utils/errorHandler';
import { sharedStyles } from '../../utils/sharedStyles';
import { ExerciseCard } from '../../components';
import { getPendingExercises, clearPendingExercises } from '../../utils/exerciseTransfer';

import type { WorkoutExercise, WorkoutSet } from '../../types/workout';

type Exercise = WorkoutExercise & {
    target: string;
    sets?: WorkoutSet[];
};

export default function CreateRoutineScreen({ navigation, route }: WorkoutScreenProps<'CreateRoutine'>) {
    const theme = useTheme();
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
                sets: []
            }));
            setSelectedExercises(exerciseObjects);
        }
    }, [isEditMode, editRoutine]);

    // Handle exercises passed from AddExerciseScreen
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Check for pending exercises when screen comes into focus
            const pendingExercises = getPendingExercises();
            if (pendingExercises) {
                const newExercises = pendingExercises.exercises.map(exercise => ({
                    ...exercise,
                    notes: '',
                    sets: [] // Start with no sets, user can add them for planning
                }));

                // Add to existing exercises instead of replacing them
                setSelectedExercises(prev => {
                    // Filter out any duplicates (by id) and add new exercises
                    const existingIds = new Set(prev.map(ex => ex.id));
                    const uniqueNewExercises = newExercises.filter(ex => !existingIds.has(ex.id));
                    return [...prev, ...uniqueNewExercises];
                });

                // Clear the pending exercises
                clearPendingExercises();
            }
        });

        return unsubscribe;
    }, [navigation]);

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
                                reps: ''
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
            if (isEditMode && editRoutine) {
                // Get the original routine to preserve creation date
                const originalRoutines = await storageService.getWorkoutRoutines();
                const originalRoutine = originalRoutines.find(r => r.id === editRoutine.id);
                
                // Update existing routine
                const updatedRoutine: WorkoutRoutine = {
                    id: editRoutine.id,
                    name: routineTitle.trim(),
                    exercises: selectedExercises.map(exercise => ({
                        name: exercise.name,
                        targetSets: exercise.sets?.length || 3 // Use planned sets or default to 3
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
                    exercises: selectedExercises.map(exercise => ({
                        name: exercise.name,
                        targetSets: exercise.sets?.length || 3 // Use planned sets or default to 3
                    })),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await storageService.saveWorkoutRoutine(newRoutine);
                showSuccess('Routine created successfully!');
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
            <ScrollView style={[sharedStyles.scrollView]} showsVerticalScrollIndicator={false}>
                {selectedExercises.length > 0 ? (
                    <>
                        <Text variant="titleMedium" style={sharedStyles.sectionTitle}>
                            Exercises ({selectedExercises.length})
                        </Text>
                        {selectedExercises.map((exercise) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                onNotesChange={handleNotesChange}
                                onSetChange={handleSetChange}
                                onAddSet={handleAddSet}
                                onDeleteExercise={handleDeleteExercise}
                                showSets={true} // Always show sets section for planning
                                editable={true}
                            />
                        ))}
                    </>
                ) : (
                    <View style={sharedStyles.emptyState}>
                        <IconButton
                            icon="dumbbell"
                            size={60}
                            iconColor={theme.colors.primary}
                            style={sharedStyles.emptyIcon}
                        />
                        <Text variant="bodyLarge" style={[sharedStyles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                            Get started by adding exercises to your routine
                        </Text>
                    </View>
                )}

                {/* Add Exercise Button */}
                <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('AddExercise')}
                    icon="plus"
                    style={styles.addExerciseButton}
                    contentStyle={styles.addExerciseButtonContent}
                >
                    {selectedExercises.length > 0 ? 'Add More Exercises' : 'Add Exercise'}
                </Button>
            </ScrollView>
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