import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import type { NutritionInfo } from '../types/nutrition';
import type { UserGoals } from '../types/nutrition';

interface GoalContextBadgeProps {
  nutrition: NutritionInfo;
  userGoals?: UserGoals;
}

export default function GoalContextBadge({ nutrition, userGoals }: GoalContextBadgeProps) {
  if (!userGoals) return null;

  const caloriePercentage = (nutrition.calories / userGoals.calories) * 100;
  const proteinPercentage = (nutrition.protein / userGoals.protein) * 100;

  const getCalorieBadge = () => {
    if (caloriePercentage < 10) return { label: 'Light', color: '#4CAF50', icon: '🍃' };
    if (caloriePercentage < 25) return { label: 'Moderate', color: '#2196F3', icon: '⚖️' };
    if (caloriePercentage < 40) return { label: 'Substantial', color: '#FF9800', icon: '🍽️' };
    return { label: 'Heavy', color: '#F44336', icon: '🔥' };
  };

  const getProteinBadge = () => {
    if (proteinPercentage > 15) return { label: 'High Protein', color: '#9C27B0', icon: '💪' };
    return null;
  };

  const calorieBadge = getCalorieBadge();
  const proteinBadge = getProteinBadge();

  return (
    <View style={styles.container}>
      <Chip
        icon={() => <Text style={styles.emoji}>{calorieBadge.icon}</Text>}
        style={[styles.badge, { backgroundColor: calorieBadge.color + '15' }]}
        textStyle={{ color: calorieBadge.color, fontSize: 10, fontWeight: '600' }}
        compact
      >
        {calorieBadge.label} ({Math.round(caloriePercentage)}% daily)
      </Chip>
      
      {proteinBadge && (
        <Chip
          icon={() => <Text style={styles.emoji}>{proteinBadge.icon}</Text>}
          style={[styles.badge, { backgroundColor: proteinBadge.color + '15', marginLeft: 6 }]}
          textStyle={{ color: proteinBadge.color, fontSize: 10, fontWeight: '600' }}
          compact
        >
          {proteinBadge.label}
        </Chip>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  badge: {
    height: 24,
  },
  emoji: {
    fontSize: 12,
  },
});
