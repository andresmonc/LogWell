import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
    Text,
    TextInput,
    Button,
    useTheme,
    IconButton
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import type { WorkoutRoutine } from '../../types/workout';
import { storageService } from '../../services/storage';
import { showError, showSuccess } from '../../utils/alertUtils';
import { sharedStyles } from '../../utils/sharedStyles';
import { ExerciseCard } from '../../components';

interface ExerciseSet {
    id: string;
    weight: string;
    reps: string;
}

interface Exercise {
    id: string;
    name: string;
    target: string;
    notes?: string;
    sets?: ExerciseSet[];
}

export default function CreateRoutineScreen({ navigation, route }: WorkoutScreenProps<'CreateRoutine'>) {
    const theme = useTheme();
    const [routineTitle, setRoutineTitle] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

    // Handle exercises passed from AddExerciseScreen
    useEffect(() => {
        if (route.params?.selectedExercises && route.params?.timestamp) {
            const newExercises = route.params.selectedExercises.map(exercise => ({
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

            // Clear the params to avoid re-adding exercises
            navigation.setParams({ 
                selectedExercises: undefined, 
                timestamp: undefined 
            });
        }
    }, [route.params?.selectedExercises, route.params?.timestamp, navigation]);

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
                    style={styles.saveButton}
                    contentStyle={styles.saveButtonContent}
                >
                    Save
                </Button>
            ),
            headerTitle: 'Create Routine',
            headerTitleAlign: 'center',
        });
    }, [navigation, routineTitle, theme]);

    const handleNotesChange = (exerciseId: string, notes: string) => {
        setSelectedExercises(prev => 
            prev.map(exercise => 
                exercise.id === exerciseId ? { ...exercise, notes } : exercise
            )
        );
    };

    const handleSetChange = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
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
    };

    const handleAddSet = (exerciseId: string) => {
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
    };

    const handleDeleteExercise = (exerciseId: string) => {
        setSelectedExercises(prev => prev.filter(exercise => exercise.id !== exerciseId));
    };

    const handleSave = async () => {
        try {
            const newRoutine: WorkoutRoutine = {
                id: `routine_${Date.now()}`, // Simple ID generation
                name: routineTitle.trim(),
                exercises: selectedExercises.map(exercise => exercise.name),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await storageService.saveWorkoutRoutine(newRoutine);
            showSuccess('Routine created successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving routine:', error);
            showError('Failed to create routine. Please try again.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Routine Title Input */}
            <View style={styles.titleSection}>
                <TextInput
                    label="Routine title"
                    value={routineTitle}
                    onChangeText={setRoutineTitle}
                    mode="outlined"
                    style={sharedStyles.input}
                />
            </View>

            {/* Exercises List */}
            <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
                {selectedExercises.length > 0 ? (
                    <>
                        <Text variant="titleMedium" style={styles.exercisesHeader}>
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
                    <View style={styles.emptyState}>
                        <IconButton
                            icon="dumbbell"
                            size={60}
                            iconColor={theme.colors.primary}
                            style={styles.weightIcon}
                        />
                        <Text variant="bodyLarge" style={[styles.getStartedText, { color: theme.colors.onSurfaceVariant }]}>
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
    container: {
        flex: 1,
    },
    saveButton: {
        marginRight: 8,
    },
    saveButtonContent: {
        margin: -8
    },
    titleSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    exercisesList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    exercisesHeader: {
        marginBottom: 16,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    weightIcon: {
        margin: 0,
        marginBottom: 16,
    },
    getStartedText: {
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    addExerciseButton: {
        marginVertical: 24,
    },
    addExerciseButtonContent: {
        paddingVertical: 8,
    },
});