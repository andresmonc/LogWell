import React, { useState } from 'react';
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

// Sample data for routines
const sampleRoutines = [
  {
    id: '1',
    name: 'Push Day',
    exercises: [
      'Bench Press',
      'Overhead Press',
      'Incline Dumbbell Press',
      'Tricep Dips',
      'Lateral Raises'
    ]
  },
  {
    id: '2',
    name: 'Pull Day',
    exercises: [
      'Pull-ups',
      'Barbell Rows',
      'Lat Pulldowns',
      'Bicep Curls',
      'Face Pulls'
    ]
  },
  {
    id: '3',
    name: 'Leg Day',
    exercises: [
      'Squats',
      'Romanian Deadlifts',
      'Leg Press',
      'Leg Curls',
      'Calf Raises'
    ]
  }
];

export default function WorkoutScreen({ navigation }: WorkoutScreenProps<'WorkoutHome'>) {
  const theme = useTheme();
  const [routinesExpanded, setRoutinesExpanded] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleStartEmptyWorkout = () => {
    navigation.navigate('WorkoutSession', {
      routineId: 'empty',
      routineName: 'Empty Workout',
      exercises: []
    });
  };

  const handleNewRoutine = () => {
    // TODO: Navigate to create routine screen
    console.log('Create new routine');
  };

  const handleStartRoutine = (routineId: string) => {
    const routine = sampleRoutines.find(r => r.id === routineId);
    if (routine) {
      navigation.navigate('WorkoutSession', {
        routineId: routine.id,
        routineName: routine.name,
        exercises: routine.exercises
      });
    }
  };

  const handleEditRoutine = (routineId: string) => {
    setOpenMenuId(null);
    // TODO: Navigate to edit routine screen
    console.log('Edit routine:', routineId);
  };

  const handleDuplicateRoutine = (routineId: string) => {
    setOpenMenuId(null);
    // TODO: Duplicate routine logic
    console.log('Duplicate routine:', routineId);
  };

  const handleDiscardRoutine = (routineId: string) => {
    setOpenMenuId(null);
    // TODO: Show confirmation dialog then delete routine
    console.log('Discard routine:', routineId);
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
                    <Menu
                      visible={openMenuId === routine.id}
                      onDismiss={() => setOpenMenuId(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          onPress={() => setOpenMenuId(routine.id)}
                          style={styles.optionsButton}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => handleEditRoutine(routine.id)}
                        title="Edit Routine"
                        leadingIcon="pencil"
                      />
                      <Menu.Item
                        onPress={() => handleDuplicateRoutine(routine.id)}
                        title="Duplicate Routine"
                        leadingIcon="content-copy"
                      />
                      <Menu.Item
                        onPress={() => handleDiscardRoutine(routine.id)}
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
                      {routine.exercises.join(' • ')}
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
});