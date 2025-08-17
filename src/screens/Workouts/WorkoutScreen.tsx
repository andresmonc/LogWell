import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  useTheme, 
  IconButton,
  List,
  Menu
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import type { WorkoutSession, WorkoutRoutine } from '../../types/workout';
import { storageService } from '../../services/storage';
import { useMenuState } from '../../hooks/useMenuState';
import { showMultiOptionAlert, showError } from '../../utils/alertUtils';
import { handleError, ErrorMessages } from '../../utils/errorHandler';
import { sharedStyles, spacing } from '../../utils/sharedStyles';

// Removed sample data - now using storage

export default function WorkoutScreen({ navigation }: WorkoutScreenProps<'WorkoutHome'>) {
  const theme = useTheme();
  const [routinesExpanded, setRoutinesExpanded] = useState(true);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const menuState = useMenuState();

  // Load routines from storage
  const loadRoutines = async () => {
    try {
      const savedRoutines = await storageService.getWorkoutRoutines();
      setRoutines(savedRoutines);
    } catch (error) {
      showError('Failed to load routines');
    }
  };

  // Check for active session on component mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const active = await storageService.getActiveWorkoutSession();
        setActiveSession(active);
      } catch (error) {
        handleError(error, ErrorMessages.LOAD_DATA, { context: 'Check active session' });
      }
    };

    checkActiveSession();
    loadRoutines();
    
    // Check again when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkActiveSession();
      loadRoutines();
    });
    return unsubscribe;
  }, [navigation]);

  const handleActiveSessionConflict = (newRoutineId: string, newRoutineName: string, newExercises: string[]) => {
    if (!activeSession) return;

    showMultiOptionAlert({
      title: 'Workout In Progress',
      message: `You have an active workout: "${activeSession.routineName}"\n\nWhat would you like to do?`,
      options: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: 'Continue Current',
          onPress: () => {
            navigation.navigate('WorkoutSession', {
              routineId: activeSession.routineId,
              routineName: activeSession.routineName,
              exercises: activeSession.exercises.map((e) => e.name)
            });
          }
        },
        {
          text: 'End & Start New',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeSession.id) {
                await storageService.completeWorkoutSession(activeSession.id);
              }
              setActiveSession(null);
              navigation.navigate('WorkoutSession', {
                routineId: newRoutineId,
                routineName: newRoutineName,
                exercises: newExercises
              });
            } catch (error) {
              handleError(error, 'Failed to end current workout. Please try again.', { context: 'End workout session' });
            }
          }
        }
      ]
    });
  };

  const handleStartEmptyWorkout = async () => {
    if (activeSession) {
      handleActiveSessionConflict('empty', 'Empty Workout', []);
      return;
    }

    navigation.navigate('WorkoutSession', {
      routineId: 'empty',
      routineName: 'Empty Workout',
      exercises: []
    });
  };

  const handleNewRoutine = () => {
    navigation.navigate('CreateRoutine');
  };

  const handleStartRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Extract exercise names from WorkoutExercise[] format
    const exerciseNames = routine.exercises.map((exercise) => exercise.name);

    if (activeSession) {
      handleActiveSessionConflict(routine.id, routine.name, exerciseNames);
      return;
    }

    navigation.navigate('WorkoutSession', {
      routineId: routine.id,
      routineName: routine.name,
      exercises: exerciseNames
    });
  };

  const handleEditRoutine = (routineId: string) => {
    menuState.closeMenu();
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Extract exercise names from WorkoutExercise[] format
    const exerciseNames = routine.exercises.map((exercise) => exercise.name);

    navigation.navigate('CreateRoutine', {
      editRoutine: {
        id: routine.id,
        name: routine.name,
        exercises: exerciseNames
      }
    });
  };

  const handleDuplicateRoutine = async (routineId: string) => {
    menuState.closeMenu();
    
    try {
      const originalRoutine = routines.find(r => r.id === routineId);
      if (!originalRoutine) return;
      
      const duplicatedRoutine = {
        ...originalRoutine,
        id: Date.now().toString(), // Generate new ID
        name: `${originalRoutine.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await storageService.saveWorkoutRoutine(duplicatedRoutine);
      await loadRoutines(); // Reload the routines list
    } catch (error) {
      handleError(error, ErrorMessages.SAVE_DATA, { context: 'Duplicate routine' });
    }
  };

  const handleDiscardRoutine = async (routineId: string) => {
    menuState.closeMenu();
    
    try {
      await storageService.deleteWorkoutRoutine(routineId);
      await loadRoutines(); // Reload the routines list
    } catch (error) {
      showError('Failed to delete routine');
    }
  };

  return (
    <ScrollView style={[sharedStyles.containerWithPadding, { backgroundColor: theme.colors.background }]}>
      {/* Active Session Indicator */}
      {activeSession && (
        <Card style={[styles.activeSessionCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Card.Content>
            <View style={styles.activeSessionHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                🏃‍♂️ Active Workout
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('WorkoutSession', {
                  routineId: activeSession.routineId,
                  routineName: activeSession.routineName,
                  exercises: activeSession.exercises.map((e: any) => e.name)
                })}
                style={styles.continueButton}
                contentStyle={styles.buttonContent}
              >
                Continue
              </Button>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>
              {activeSession.routineName}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Quick Start Section */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Quick Start</Title>
        <Button
          mode="contained"
          onPress={handleStartEmptyWorkout}
          style={styles.quickStartButton}
          icon="plus"
          contentStyle={styles.buttonContent}
        >
          Start Empty Workout
        </Button>
      </View>

      {/* Routines Section */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Routines</Title>
        <Button
          mode="outlined"
          onPress={handleNewRoutine}
          style={styles.newRoutineButton}
          icon="plus"
          contentStyle={styles.buttonContent}
        >
          New Routine
        </Button>
      </View>

      {/* My Routines Section */}
      <View style={styles.section}>
        <List.Accordion
          title="My Routines"
          titleStyle={styles.accordionTitle}
          expanded={routinesExpanded}
          onPress={() => setRoutinesExpanded(!routinesExpanded)}
          style={styles.accordion}
        >
          {routines.map((routine, index) => (
            <View key={routine.id}>
              <Card style={styles.routineCard}>
                <Card.Content>
                  <View style={styles.routineHeader}>
                    <Title style={styles.routineName}>{routine.name}</Title>
                    <Menu
                      visible={menuState.isMenuOpen(routine.id)}
                      onDismiss={menuState.closeMenu}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          onPress={() => menuState.openMenu(routine.id)}
                          style={styles.optionsButton}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          menuState.closeMenu();
                          handleEditRoutine(routine.id);
                        }}
                        title="Edit Routine"
                        leadingIcon="pencil"
                      />
                      <Menu.Item
                        onPress={() => {
                          menuState.closeMenu();
                          handleDuplicateRoutine(routine.id);
                        }}
                        title="Duplicate Routine"
                        leadingIcon="content-copy"
                      />
                      <Menu.Item
                        onPress={() => {
                          menuState.closeMenu();
                          handleDiscardRoutine(routine.id);
                        }}
                        title="Discard Routine"
                        leadingIcon="delete"
                      />
                    </Menu>
                  </View>
                  
                  <View style={styles.exercisesList}>
                    <Text variant="bodySmall" style={styles.exerciseCount}>
                      {routine.exercises.length} exercises
                    </Text>
                    <Text variant="bodyMedium" style={styles.exerciseText}>
                      {routine.exercises.map((exercise) => exercise.name).join(' • ')}
                    </Text>
                  </View>
                  
                  <Button
                    mode="contained"
                    onPress={() => handleStartRoutine(routine.id)}
                    style={styles.startRoutineButton}
                    contentStyle={styles.buttonContent}
                  >
                    Start Routine
                  </Button>
                </Card.Content>
              </Card>
              {index < routines.length - 1 && <View style={styles.cardSpacing} />}
            </View>
          ))}
        </List.Accordion>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '600',
  },
  quickStartButton: {
    marginVertical: spacing.sm,
  },
  newRoutineButton: {
    marginVertical: spacing.sm,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  accordion: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  accordionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  routineCard: {
    marginVertical: spacing.sm,
  },
  routineHeader: {
    ...sharedStyles.headerRow,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  optionsButton: {
    margin: 0,
  },
  exercisesList: {
    marginBottom: spacing.lg,
  },
  exerciseCount: {
    opacity: 0.6,
    marginBottom: 4,
  },
  exerciseText: {
    opacity: 0.8,
    lineHeight: 20,
  },
  startRoutineButton: {
    marginTop: 8,
  },
  cardSpacing: {
    height: 8,
  },
  activeSessionCard: {
    marginBottom: spacing.lg,
  },
  activeSessionHeader: {
    ...sharedStyles.headerRow,
    marginBottom: spacing.sm,
  },
  continueButton: {
    minWidth: 100,
  },
});