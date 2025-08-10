import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import {
  Card,
  Text,
  TextInput,
  IconButton,
  Divider,
  useTheme,
  Avatar
} from 'react-native-paper';
import { sharedStyles, spacing } from '../utils/sharedStyles';
import { handleError, ErrorMessages } from '../utils/errorHandler';
import { getExerciseImage, hasExerciseImage } from '../utils/exerciseImages';
import { exerciseService } from '../services';
import ExerciseHeader from './ExerciseHeader';

import type { WorkoutExercise, WorkoutSet } from '../types/workout';

interface ExerciseCardProps {
  exercise: WorkoutExercise & {
    target: string;
    sets?: WorkoutSet[];
  };
  onNotesChange?: (exerciseId: string, notes: string) => void;
  onSetChange?: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => void;
  onAddSet?: (exerciseId: string) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  showSets?: boolean;
  editable?: boolean;
}

export default function ExerciseCard({
  exercise,
  onNotesChange,
  onSetChange,
  onAddSet,
  onDeleteExercise,
  showSets = false,
  editable = true
}: ExerciseCardProps) {
  const theme = useTheme();
  const [exerciseImageMap, setExerciseImageMap] = useState<Map<string, string>>(new Map());

  // Build exercise name to ID mapping for image lookup
  useEffect(() => {
    const buildImageMapping = async () => {
      try {
        const searchResults = await exerciseService.searchSelectableExercises(exercise.name);
        const nameToIdMap = new Map<string, string>();
        
        searchResults.forEach(ex => {
          nameToIdMap.set(ex.name.toLowerCase(), ex.id);
        });
        
        setExerciseImageMap(nameToIdMap);
      } catch (error) {
        handleError(error, ErrorMessages.LOAD_DATA, { context: 'Build exercise image mapping', showAlert: false });
      }
    };

    buildImageMapping();
  }, [exercise.name]);

  const renderExerciseImage = () => {
    const exerciseId = exerciseImageMap.get(exercise.name.toLowerCase());
    
    if (exerciseId && hasExerciseImage(exerciseId)) {
      const imageSource = getExerciseImage(exerciseId);
      return (
        <Image 
          source={imageSource} 
          style={sharedStyles.circularImage}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <Avatar.Icon 
        size={40} 
        icon="dumbbell" 
        style={sharedStyles.circularImage}
      />
    );
  };

  const handleNotesChange = (text: string) => {
    if (onNotesChange) {
      onNotesChange(exercise.id, text);
    }
  };

  const handleSetChange = (setId: string, field: 'weight' | 'reps', value: string) => {
    if (onSetChange) {
      onSetChange(exercise.id, setId, field, value);
    }
  };

  const handleAddSet = () => {
    if (onAddSet) {
      onAddSet(exercise.id);
    }
  };

  const handleDeleteExercise = () => {
    if (onDeleteExercise) {
      onDeleteExercise(exercise.id);
    }
  };

  return (
    <Card style={styles.exerciseCard}>
      <Card.Content>
        {/* Exercise Header */}
        <ExerciseHeader
          title={exercise.name}
          subtitle={exercise.target}
          left={renderExerciseImage()}
          showOptions={!!(editable && onDeleteExercise)}
          menuItems={
            editable && onDeleteExercise
              ? [
                  {
                    title: 'Remove Exercise',
                    icon: 'delete',
                    onPress: handleDeleteExercise,
                  },
                ]
              : []
          }
          showNotes={true}
          notesEditable={!!editable}
          notesValue={exercise.notes || ''}
          notesPlaceholder={'Add notes here...'}
          onNotesChange={handleNotesChange}
        />

        {/* Notes now handled by ExerciseHeader */}

        {/* Sets Section - Only shown if showSets is true */}
        {showSets && (
          <>
            {/* Sets Table Header - Only show if there are sets */}
            {exercise.sets && exercise.sets.length > 0 && (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.setColumn]}>Set</Text>
                  <Text style={[styles.tableHeaderText, styles.weightColumn]}>LBs</Text>
                  <Text style={[styles.tableHeaderText, styles.repsColumn]}>Reps</Text>
                </View>

                <Divider style={styles.tableDivider} />

                {/* Sets Table Rows */}
                {exercise.sets.map((set, index) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={[styles.setCellText, styles.setColumn]}>{index + 1}</Text>

                    <TextInput
                      value={set.weight}
                      onChangeText={(text) => handleSetChange(set.id, 'weight', text)}
                      style={[sharedStyles.compactInput, styles.weightColumn]}
                      mode="flat"
                      keyboardType="numeric"
                      dense
                      disabled={!editable}
                      underlineStyle={{ height: 0 }}
                      contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 8, textAlign: 'center' }}
                      placeholder="0"
                    />

                    <TextInput
                      value={set.reps}
                      onChangeText={(text) => handleSetChange(set.id, 'reps', text)}
                      style={[sharedStyles.compactInput, styles.repsColumn]}
                      mode="flat"
                      keyboardType="numeric"
                      dense
                      disabled={!editable}
                      underlineStyle={{ height: 0 }}
                      contentStyle={{ backgroundColor: 'transparent', paddingHorizontal: 8, textAlign: 'center' }}
                      placeholder="0"
                    />
                  </View>
                ))}
              </>
            )}

            {/* Add Set Button */}
            {editable && onAddSet && (
              <View style={styles.addSetContainer}>
                <IconButton
                  icon="plus"
                  mode="contained-tonal"
                  onPress={handleAddSet}
                  style={styles.addSetButton}
                />
                <Text style={styles.addSetText}>
                  {(!exercise.sets || exercise.sets.length === 0) ? 'Add Set to Plan' : 'Add Set'}
                </Text>
              </View>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    marginBottom: spacing.lg,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  optionsButton: {
    margin: 0,
    marginTop: -8,
    marginRight: -12,
  },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  tableDivider: {
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  setCellText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  setColumn: {
    flex: 0.5,
  },
  weightColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  repsColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  addSetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addSetButton: {
    marginRight: 8,
  },
  addSetText: {
    fontWeight: '500',
  },
});