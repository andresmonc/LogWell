import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
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
  Menu
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';
import { storageService } from '../../services/storage';

interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
}

interface ExerciseData {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes: string;
}

interface WorkoutSessionData {
  id?: string;
  routineId: string;
  routineName: string;
  startTime: Date;
  exercises: ExerciseData[];
  completed?: boolean;
}

export default function WorkoutSessionScreen({ route, navigation }: WorkoutScreenProps<'WorkoutSession'>) {
  const theme = useTheme();
  const { routineId, routineName, exercises } = route.params;
  
  // Timer state
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  
  // Workout state
  const [workoutData, setWorkoutData] = useState<WorkoutSessionData>({
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
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Handle finishing the workout
  const handleFinishWorkout = () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout? This will save your progress and end the session.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            try {
              if (workoutData.id) {
                await storageService.completeWorkoutSession(workoutData.id);
              }
              navigation.goBack();
            } catch (error) {
              console.error('Error finishing workout:', error);
              Alert.alert('Error', 'Failed to finish workout. Please try again.');
            }
          }
        }
      ]
    );
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

  // Calculate stats
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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
          <Text variant="titleMedium" style={styles.statValue}>{Math.round(totalVolume)}lbs</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="bodySmall" style={styles.statLabel}>Sets</Text>
          <Text variant="titleMedium" style={styles.statValue}>{totalSets}</Text>
        </View>
      </View>

      {/* Scrollable Exercise List */}
      <ScrollView style={styles.exerciseList}>
        {workoutData.exercises.map((exercise) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <Card.Content>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <Title style={styles.exerciseName}>{exercise.name}</Title>
                <Menu
                  visible={openMenuId === exercise.id}
                  onDismiss={() => setOpenMenuId(null)}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      onPress={() => setOpenMenuId(exercise.id)}
                      style={styles.optionsButton}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setOpenMenuId(null);
                      console.log('Replace exercise');
                    }}
                    title="Replace Exercise"
                    leadingIcon="swap-horizontal"
                  />
                  <Menu.Item
                    onPress={() => {
                      setOpenMenuId(null);
                      console.log('Remove exercise');
                    }}
                    title="Remove Exercise"
                    leadingIcon="delete"
                  />
                </Menu>
              </View>

              {/* Notes Section */}
              <TextInput
                label="Add Notes Here"
                value={exercise.notes}
                onChangeText={(text) => handleNotesChange(exercise.id, text)}
                style={styles.notesInput}
                mode="outlined"
                multiline
                numberOfLines={2}
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
                    style={[styles.setInput, styles.weightColumn]}
                    mode="outlined"
                    keyboardType="numeric"
                    dense
                  />
                  
                  <TextInput
                    value={set.reps}
                    onChangeText={(text) => handleSetChange(exercise.id, set.id, 'reps', text)}
                    style={[styles.setInput, styles.repsColumn]}
                    mode="outlined"
                    keyboardType="numeric"
                    dense
                  />
                  
                  <View style={styles.checkColumn}>
                    <Checkbox
                      status={set.completed ? 'checked' : 'unchecked'}
                      onPress={() => handleSetChange(exercise.id, set.id, 'completed', !set.completed)}
                    />
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
    marginBottom: 4,
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
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  optionsButton: {
    margin: 0,
  },
  notesInput: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  setColumn: {
    width: 40,
    textAlign: 'center',
  },
  previousColumn: {
    width: 80,
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
  setInput: {
    height: 40,
    fontSize: 14,
  },
  addSetButton: {
    marginTop: 12,
  },
});