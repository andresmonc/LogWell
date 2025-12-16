import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  useTheme,
  IconButton,
  Divider,
  List,
} from 'react-native-paper';
import type { FoodLogScreenProps } from '../../types/navigation';
import type { Recipe, RecipeIngredient, Food, NutritionInfo } from '../../types/nutrition';
import { storageService } from '../../services/storage';
import { showError } from '../../utils/alertUtils';
import { showSuccess } from '../../utils/errorHandler';
import { sharedStyles, spacing } from '../../utils/sharedStyles';
import { generateId } from '../../utils/idGenerator';
import { useNutritionStore } from '../../stores/nutritionStore';
import { getPendingFood, clearPendingFood } from '../../utils/foodTransfer';

function RecipeBuilderScreen({ navigation }: FoodLogScreenProps<'RecipeBuilder'>) {
  const theme = useTheme();
  const { addFood } = useNutritionStore();

  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Listen for selected food from Search screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const pending = getPendingFood();
      if (pending) {
        const newIngredient: RecipeIngredient = {
          food: pending.food,
          quantity: 1,
        };
        setIngredients(prev => [...prev, newIngredient]);
        clearPendingFood();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const calculateTotalNutrition = useCallback((): NutritionInfo => {
    return ingredients.reduce(
      (acc, ing) => {
        const nutrition = ing.food.nutritionPerServing;
        return {
          calories: acc.calories + nutrition.calories * ing.quantity,
          protein: acc.protein + nutrition.protein * ing.quantity,
          carbs: acc.carbs + nutrition.carbs * ing.quantity,
          fat: acc.fat + nutrition.fat * ing.quantity,
          fiber: (acc.fiber || 0) + (nutrition.fiber || 0) * ing.quantity,
          sugar: (acc.sugar || 0) + (nutrition.sugar || 0) * ing.quantity,
          sodium: (acc.sodium || 0) + (nutrition.sodium || 0) * ing.quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
  }, [ingredients]);

  const calculateRecipeNutrition = useCallback((): NutritionInfo => {
    const totalNutrition = calculateTotalNutrition();
    const servingCount = parseFloat(servings) || 1;
    return {
      calories: Math.round(totalNutrition.calories / servingCount),
      protein: Math.round(totalNutrition.protein / servingCount),
      carbs: Math.round(totalNutrition.carbs / servingCount),
      fat: Math.round(totalNutrition.fat / servingCount),
      fiber: Math.round((totalNutrition.fiber || 0) / servingCount),
      sugar: Math.round((totalNutrition.sugar || 0) / servingCount),
      sodium: Math.round((totalNutrition.sodium || 0) / servingCount),
    };
  }, [calculateTotalNutrition, servings]);

  const getIngredientCaloriePercentage = (ingredient: RecipeIngredient): number => {
    const totalCalories = calculateTotalNutrition().calories;
    if (totalCalories === 0) return 0;
    const ingredientCalories = ingredient.food.nutritionPerServing.calories * ingredient.quantity;
    return Math.round((ingredientCalories / totalCalories) * 100);
  };

  const handleAddIngredient = () => {
    navigation.navigate('Search', { selectMode: true });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: string) => {
    const parsed = parseFloat(quantity);
    if (!isNaN(parsed) && parsed > 0) {
      setIngredients(prev =>
        prev.map((ing, i) => (i === index ? { ...ing, quantity: parsed } : ing))
      );
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      showError('Please enter a recipe name');
      return;
    }

    if (ingredients.length === 0) {
      showError('Please add at least one ingredient');
      return;
    }

    const servingCount = parseFloat(servings);
    if (isNaN(servingCount) || servingCount <= 0) {
      showError('Please enter a valid number of servings');
      return;
    }

    try {
      const nutrition = calculateRecipeNutrition();
      const recipeId = generateId('recipe');

      const recipe: Recipe = {
        id: recipeId,
        name: recipeName,
        ingredients,
        servings: servingCount,
        nutritionPerServing: nutrition,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveRecipe(recipe);

      // Also create a Food entry for this recipe so it can be logged
      const recipeFood: Food = {
        id: `food-${recipeId}`,
        name: recipeName,
        brand: 'Recipe',
        nutritionPerServing: nutrition,
        servingDescription: '1 serving',
        isRecipe: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addFood(recipeFood);

      showSuccess('Recipe saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving recipe:', error);
      showError('Failed to save recipe. Please try again.');
    }
  };

  const nutritionPerServing = calculateRecipeNutrition();

  return (
    <ScrollView
      style={[sharedStyles.containerWithPadding, { backgroundColor: theme.colors.background }]}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recipe Details</Title>
          <TextInput
            label="Recipe Name"
            value={recipeName}
            onChangeText={setRecipeName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Servings"
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Ingredients</Title>
            <Button mode="contained" onPress={handleAddIngredient} icon="plus">
              Add
            </Button>
          </View>

          {ingredients.length === 0 ? (
            <Text style={styles.emptyText}>No ingredients added yet</Text>
          ) : (
            ingredients.map((ingredient, index) => {
              const caloriePercent = getIngredientCaloriePercentage(ingredient);
              const ingredientCalories = Math.round(
                ingredient.food.nutritionPerServing.calories * ingredient.quantity
              );
              return (
                <View key={index}>
                  <List.Item
                    title={ingredient.food.name}
                    description={
                      <View>
                        <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                          {ingredient.food.brand || ingredient.food.servingDescription}
                        </Text>
                        <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 2 }}>
                          {ingredientCalories} cal ({caloriePercent}% of total)
                        </Text>
                      </View>
                    }
                    left={props => <List.Icon {...props} icon="food-apple" />}
                    right={() => (
                      <View style={styles.ingredientActions}>
                        <TextInput
                          value={ingredient.quantity.toString()}
                          onChangeText={val => handleUpdateQuantity(index, val)}
                          keyboardType="numeric"
                          mode="outlined"
                          dense
                          style={styles.quantityInput}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => handleRemoveIngredient(index)}
                        />
                      </View>
                    )}
                  />
                  {index < ingredients.length - 1 && <Divider />}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      {ingredients.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Nutrition Summary</Title>
            
            <View style={styles.nutritionSection}>
              <Text variant="titleSmall" style={styles.nutritionSectionTitle}>
                Per Serving ({parseFloat(servings) || 1} {parseFloat(servings) > 1 ? 'servings' : 'serving'} total)
              </Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.calories}</Text>
                  <Text style={styles.nutritionLabel}>cal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.protein}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.fat}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>
            </View>

            <Divider style={styles.nutritionDivider} />

            <View style={styles.nutritionSection}>
              <Text variant="titleSmall" style={styles.nutritionSectionTitle}>
                Total Recipe
              </Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{calculateTotalNutrition().calories}</Text>
                  <Text style={styles.nutritionLabel}>cal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{calculateTotalNutrition().protein}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{calculateTotalNutrition().carbs}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{calculateTotalNutrition().fat}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSaveRecipe}
          style={styles.saveButton}
          disabled={!recipeName.trim() || ingredients.length === 0}
        >
          Save Recipe
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: spacing.lg,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityInput: {
    width: 60,
  },
  nutritionSection: {
    marginVertical: spacing.sm,
  },
  nutritionSectionTitle: {
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: spacing.md,
    borderRadius: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutritionDivider: {
    marginVertical: spacing.md,
  },
  buttonContainer: {
    marginVertical: spacing.lg,
  },
  saveButton: {
    paddingVertical: 8,
  },
});

RecipeBuilderScreen.displayName = 'RecipeBuilderScreen';

export default RecipeBuilderScreen;
