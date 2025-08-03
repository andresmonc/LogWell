import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import {
  Card,
  Title,
  Text,
  TextInput,
  IconButton,
  Menu,
  Divider,
  useTheme,
  Avatar
} from 'react-native-paper';
import { sharedStyles } from '../utils/sharedStyles';
import { getExerciseImage, hasExerciseImage } from '../utils/exerciseImages';
import { exerciseService } from '../services';

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

interface ExerciseCardProps {
  exercise: Exercise;
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [exerciseImageMap, setExerciseImageMap] = useState<Map<string, string>>(new Map());

  // Build exercise name to ID mapping for image lookup
  useEffect(() => {
    const buildImageMapping = async () => {
      try {
        const searchResults = await exerciseService.searchWorkoutExercises(exercise.name);
        const nameToIdMap = new Map<string, string>();
        
        searchResults.forEach(ex => {
          nameToIdMap.set(ex.name.toLowerCase(), ex.id);
        });
        
        setExerciseImageMap(nameToIdMap);
      } catch (error) {
        console.error('Error building exercise image mapping:', error);
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
    setMenuVisible(false);
    if (onDeleteExercise) {
      onDeleteExercise(exercise.id);
    }
  };

  return (
    <Card style={styles.exerciseCard}>
      <Card.Content>
        {/* Exercise Header */}
        <View style={styles.exerciseHeader}>
          <View style={sharedStyles.listItemContent}>
            <View style={sharedStyles.imageContainer}>
              {renderExerciseImage()}
            </View>
            <View style={sharedStyles.listItemDetails}>
              <Title style={sharedStyles.listItemTitle}>{exercise.name}</Title>
              <Text style={[sharedStyles.listItemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {exercise.target}
              </Text>
            </View>
          </View>
          
          {editable && onDeleteExercise && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                  style={styles.optionsButton}
                />
              }
            >
              <Menu.Item
                onPress={handleDeleteExercise}
                title="Remove Exercise"
                leadingIcon="delete"
              />
            </Menu>
          )}
        </View>

        {/* Notes Section */}
        {editable && (
          <TextInput
            placeholder="Add notes here..."
            value={exercise.notes || ''}
            onChangeText={handleNotesChange}
            style={sharedStyles.notesInput}
            mode="flat"
            multiline
            numberOfLines={1}
            underlineStyle={{ height: 0 }}
            contentStyle={{ backgroundColor: 'transparent', paddingVertical: 8 }}
          />
        )}

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
    marginBottom: 16,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  optionsButton: {
    margin: 0,
    marginTop: -8,
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
    marginBottom: 8,
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