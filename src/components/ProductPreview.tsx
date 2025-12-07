/**
 * Product Preview Component
 * Displays product information from Open Food Facts and allows user to add to log
 */
import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import type { ParsedProduct } from '../services/openFoodFacts';
import type { NutritionInfo } from '../types/nutrition';
import { sharedStyles } from '../utils/sharedStyles';

export interface ProductPreviewProps {
  product: ParsedProduct;
  onAddToLog: (quantity: number) => void;
  onAddToDatabase: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductPreview({
  product,
  onAddToLog,
  onAddToDatabase,
  onCancel,
  isLoading = false,
}: ProductPreviewProps) {
  const theme = useTheme();
  const [quantity, setQuantity] = useState('1');

  const handleAddToLog = () => {
    const qty = parseFloat(quantity) || 1;
    if (qty > 0) {
      onAddToLog(qty);
    }
  };

  const nutrition = product.nutritionPerServing;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Adding to log...
          </Text>
        </View>
      ) : (
        <>
          {/* Product Image */}
          {product.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Product Info */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.productName, { color: theme.colors.onSurface }]}>
                {product.name}
              </Title>
              {product.brand && (
                <Text style={[styles.brand, { color: theme.colors.onSurfaceVariant }]}>
                  {product.brand}
                </Text>
              )}
              <Text style={[styles.servingSize, { color: theme.colors.onSurfaceVariant }]}>
                Serving: {product.servingSize}
              </Text>
            </Card.Content>
          </Card>

          {/* Nutrition Info */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Nutrition per Serving
              </Title>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                    {nutrition.calories}
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Calories
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                    {nutrition.protein}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Protein
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                    {nutrition.carbs}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Carbs
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                    {nutrition.fat}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Fat
                  </Text>
                </View>
              </View>

              {/* Optional nutrients */}
              {(nutrition.fiber !== undefined || nutrition.sugar !== undefined || nutrition.sodium !== undefined) && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.optionalNutrition}>
                    {nutrition.fiber !== undefined ? (
                      <Text style={[styles.optionalText, { color: theme.colors.onSurfaceVariant }]}>
                        Fiber: {nutrition.fiber}g
                      </Text>
                    ) : null}
                    {nutrition.sugar !== undefined ? (
                      <Text style={[styles.optionalText, { color: theme.colors.onSurfaceVariant }]}>
                        Sugar: {nutrition.sugar}g
                      </Text>
                    ) : null}
                    {nutrition.sodium !== undefined ? (
                      <Text style={[styles.optionalText, { color: theme.colors.onSurfaceVariant }]}>
                        Sodium: {nutrition.sodium}mg
                      </Text>
                    ) : null}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Quantity Input */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.quantityLabel, { color: theme.colors.onSurface }]}>
                Quantity (servings):
              </Text>
              <View style={styles.quantityContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    const qty = Math.max(0.5, (parseFloat(quantity) || 1) - 0.5);
                    setQuantity(qty.toString());
                  }}
                  style={styles.quantityButton}
                >
                  -
                </Button>
                <Text style={[styles.quantityValue, { color: theme.colors.onSurface }]}>
                  {quantity}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    const qty = (parseFloat(quantity) || 1) + 0.5;
                    setQuantity(qty.toString());
                  }}
                  style={styles.quantityButton}
                >
                  +
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleAddToLog}
              style={[styles.actionButton, styles.primaryButton]}
              disabled={isLoading}
            >
              Add to Log
            </Button>
            <Button
              mode="outlined"
              onPress={onAddToDatabase}
              style={styles.actionButton}
              disabled={isLoading}
            >
              Save to Database
            </Button>
            <Button
              mode="text"
              onPress={onCancel}
              style={styles.actionButton}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  imageContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 80,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  optionalNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  optionalText: {
    fontSize: 12,
    marginVertical: 4,
  },
  quantityLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    minWidth: 60,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  primaryButton: {
    marginBottom: 12,
  },
});

