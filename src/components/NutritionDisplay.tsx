import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { calculateEntryNutrition } from '../utils/nutritionCalculators';
import type { NutritionDisplayProps } from '../types/components';

export default function NutritionDisplay({
  entry,
  showProtein = true,
  variant = 'bodyMedium',
  detailed = false
}: NutritionDisplayProps) {
  const nutrition = calculateEntryNutrition(entry);
  
  // Show serving description with quantity
  const servingInfo = `${entry.quantity} × ${entry.food.servingDescription}`;

  if (detailed) {
    return (
      <View style={styles.detailedContainer}>
        <Text variant="bodySmall" style={styles.servingText}>
          {servingInfo}
        </Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text variant="labelLarge" style={styles.macroValue}>
              {Math.round(nutrition.calories)}
            </Text>
            <Text variant="labelSmall" style={styles.macroLabel}>cal</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text variant="labelLarge" style={styles.macroValue}>
              {Math.round(nutrition.protein)}g
            </Text>
            <Text variant="labelSmall" style={styles.macroLabel}>protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text variant="labelLarge" style={styles.macroValue}>
              {Math.round(nutrition.carbs)}g
            </Text>
            <Text variant="labelSmall" style={styles.macroLabel}>carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text variant="labelLarge" style={styles.macroValue}>
              {Math.round(nutrition.fat)}g
            </Text>
            <Text variant="labelSmall" style={styles.macroLabel}>fat</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Text variant={variant} style={styles.compactText}>
      {servingInfo} • {Math.round(nutrition.calories)} cal
      {showProtein && ` • ${Math.round(nutrition.protein)}g protein`}
    </Text>
  );
}

const styles = StyleSheet.create({
  detailedContainer: {
    marginTop: 8,
  },
  servingText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  macroLabel: {
    opacity: 0.6,
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 4,
  },
  compactText: {
    opacity: 0.8,
  },
});