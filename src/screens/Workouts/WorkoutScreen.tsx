import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  useTheme, 
  IconButton,
  List
} from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';

// Sample data for routines
const sampleRoutines = [
  {
    id: '1',
    name: 'Push Day',
    exercises: [
      'Bench Press - 3x8-10',
      'Overhead Press - 3x8-10',
      'Incline Dumbbell Press - 3x10-12',
      'Tricep Dips - 3x12-15',
      'Lateral Raises - 3x12-15'
    ]
  },
  {
    id: '2',
    name: 'Pull Day',
    exercises: [
      'Pull-ups - 3x6-8',
      'Barbell Rows - 3x8-10',
      'Lat Pulldowns - 3x10-12',
      'Bicep Curls - 3x12-15',
      'Face Pulls - 3x15-20'
    ]
  },
  {
    id: '3',
    name: 'Leg Day',
    exercises: [
      'Squats - 3x8-10',
      'Romanian Deadlifts - 3x8-10',
      'Leg Press - 3x12-15',
      'Leg Curls - 3x12-15',
      'Calf Raises - 4x15-20'
    ]
  }
];

export default function WorkoutScreen({ navigation }: WorkoutScreenProps<'WorkoutHome'>) {
  const theme = useTheme();
  const [routinesExpanded, setRoutinesExpanded] = useState(true);

  const handleStartEmptyWorkout = () => {
    // TODO: Navigate to workout session screen
    console.log('Start empty workout');
  };

  const handleNewRoutine = () => {
    // TODO: Navigate to create routine screen
    console.log('Create new routine');
  };

  const handleStartRoutine = (routineId: string) => {
    // TODO: Navigate to workout session with routine
    console.log('Start routine:', routineId);
  };

  const handleRoutineOptions = (routineId: string) => {
    // TODO: Show options menu (edit, duplicate, delete)
    console.log('Routine options:', routineId);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          {sampleRoutines.map((routine, index) => (
            <View key={routine.id}>
              <Card style={styles.routineCard}>
                <Card.Content>
                  <View style={styles.routineHeader}>
                    <Title style={styles.routineName}>{routine.name}</Title>
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      onPress={() => handleRoutineOptions(routine.id)}
                      style={styles.optionsButton}
                    />
                  </View>
                  
                  <View style={styles.exercisesList}>
                    {routine.exercises.map((exercise, exerciseIndex) => (
                      <View key={exerciseIndex} style={styles.exerciseItem}>
                        <Text variant="bodyMedium" style={styles.exerciseText}>
                          • {exercise}
                        </Text>
                      </View>
                    ))}
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
              {index < sampleRoutines.length - 1 && <View style={styles.cardSpacing} />}
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
    padding: 16,
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
    marginVertical: 8,
  },
  newRoutineButton: {
    marginVertical: 8,
  },
  buttonContent: {
    paddingVertical: 8,
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
    marginVertical: 8,
    marginHorizontal: 16,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  exerciseItem: {
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
});