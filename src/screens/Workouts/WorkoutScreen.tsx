import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, useTheme } from 'react-native-paper';
import type { WorkoutScreenProps } from '../../types/navigation';

export default function WorkoutScreen({ navigation }: WorkoutScreenProps<'WorkoutHome'>) {
  const theme = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Workouts</Title>
          <Text variant="bodyLarge" style={styles.comingSoon}>
            Coming Soon!
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Track your workouts, exercises, and fitness progress here.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  comingSoon: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.7,
  },
  description: {
    textAlign: 'center',
    opacity: 0.6,
  },
});