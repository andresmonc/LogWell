import React, { useState, useCallback } from 'react';
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

function RecipeBuilderScreen({ navigation }: FoodLogScreenProps<'RecipeBuilder'>) {
  const theme = useTheme();
  const { addFood } = useNutritionStore();

  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState('1');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const calculateRecipeNutrition = useCallback((): NutritionInfo => {
    const totalNutrition = ingredients.reduce(
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
  }, [ingredients, servings]);

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
        instructions: instructions.trim() || undefined,
        prepTime: prepTime ? parseInt(prepTime) : undefined,
        cookTime: cookTime ? parseInt(cookTime) : undefined,
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

          <View style={styles.row}>
            <TextInput
              label="Servings"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, styles.halfWidth]}
            />
            <TextInput
              label="Prep Time (min)"
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, styles.halfWidth]}
            />
          </View>

          <TextInput
            label="Cook Time (min)"
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Instructions (optional)"
            value={instructions}
            onChangeText={setInstructions}
            mode="outlined"
            multiline
            numberOfLines={4}
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
            ingredients.map((ingredient, index) => (
              <View key={index}>
                <List.Item
                  title={ingredient.food.name}
                  description={`${ingredient.food.brand || ''} - ${
                    ingredient.food.servingDescription
                  }`}
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
            ))
          )}
        </Card.Content>
      </Card>

      {ingredients.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Nutrition Per Serving</Title>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Calories</Text>
                <Text style={styles.nutritionValue}>{nutritionPerServing.calories}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>{nutritionPerServing.protein}g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Carbs</Text>
                <Text style={styles.nutritionValue}>{nutritionPerServing.carbs}g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Fat</Text>
                <Text style={styles.nutritionValue}>{nutritionPerServing.fat}g</Text>
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
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
