import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

export default function CreateRoutineScreen({ navigation }: WorkoutScreenProps<'CreateRoutine'>) {
    const theme = useTheme();
    const [routineTitle, setRoutineTitle] = useState('');

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

    const handleSave = async () => {
        try {
            const newRoutine: WorkoutRoutine = {
                id: `routine_${Date.now()}`, // Simple ID generation
                name: routineTitle.trim(),
                exercises: [],
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
        <View style={[sharedStyles.containerWithPadding, { backgroundColor: theme.colors.background }]}>
            {/* Routine Title Input */}
            <TextInput
                label="Routine title"
                value={routineTitle}
                onChangeText={setRoutineTitle}
                mode="outlined"
                style={sharedStyles.input}
            />

            {/* Exercise Section */}
            <View style={styles.exerciseSection}>
                {/* Weight Icon */}
                <View style={styles.iconContainer}>
                    <IconButton
                        icon="dumbbell"
                        size={60}
                        iconColor={theme.colors.primary}
                        style={styles.weightIcon}
                    />
                </View>

                {/* Get Started Text */}
                <Text variant="bodyLarge" style={[styles.getStartedText, { color: theme.colors.onSurfaceVariant }]}>
                    Get started by adding exercises to your routine
                </Text>

                                 {/* Add Exercise Button */}
                 <Button
                     mode="outlined"
                     onPress={() => navigation.navigate('AddExercise')}
                     icon="plus"
                     style={styles.addExerciseButton}
                     contentStyle={styles.addExerciseButtonContent}
                 >
                     Add Exercise
                 </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    saveButton: {
        marginRight: 8,
    },
    saveButtonContent: {
        margin: -8
    },
    exerciseSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        marginBottom: 24,
    },
    weightIcon: {
        margin: 0,
    },
    getStartedText: {
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    addExerciseButton: {
        minWidth: 200,
    },
    addExerciseButtonContent: {
        paddingVertical: 8,
    },
});