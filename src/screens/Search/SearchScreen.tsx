import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Searchbar,
  List,
  useTheme,
  TextInput,
  SegmentedButtons,
  Divider
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { SearchScreenProps } from '../../types/navigation';
import type { Food, MealType, NutritionInfo } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import { FormModal, AIFoodAnalyzer } from '../../components';
import { useFormModal } from '../../hooks/useFormModal';
import { commonStyles } from '../../utils/commonStyles';

export default function SearchScreen({ navigation }: SearchScreenProps<'SearchHome'>) {
  const theme = useTheme();
  const { foods, searchFoods, addFood, addFoodEntry, chatGptApiKey } = useNutritionStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const addFoodModal = useFormModal();
  const addEntryModal = useFormModal();
  const aiAnalysisModal = useFormModal();
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  
  // Add Food Form State
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProtein, setNewFoodProtein] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const [newFoodFat, setNewFoodFat] = useState('');
  const [newFoodServingSize, setNewFoodServingSize] = useState('');
  
  // Add Entry Form State
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<'grams' | 'servings'>('grams');
  const [mealType, setMealType] = useState<MealType>('breakfast');

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredFoods(searchFoods(searchQuery));
    } else {
      setFilteredFoods(foods.slice(0, 20)); // Show recent foods
    }
  }, [searchQuery, foods]);

  const handleAddFood = async () => {
    if (!newFoodName.trim() || !newFoodCalories) {
      Alert.alert('Error', 'Please fill in at least the food name and calories.');
      return;
    }

    try {
      const nutritionInfo: NutritionInfo = {
        calories: parseFloat(newFoodCalories) || 0,
        protein: parseFloat(newFoodProtein) || 0,
        carbs: parseFloat(newFoodCarbs) || 0,
        fat: parseFloat(newFoodFat) || 0,
      };

      await addFood({
        name: newFoodName.trim(),
        brand: newFoodBrand.trim() || undefined,
        nutritionPer100g: nutritionInfo,
        servingSize: parseFloat(newFoodServingSize) || undefined,
        servingSizeUnit: 'grams',
        category: 'other',
      });

      // Reset form
      setNewFoodName('');
      setNewFoodBrand('');
      setNewFoodCalories('');
      setNewFoodProtein('');
      setNewFoodCarbs('');
      setNewFoodFat('');
      setNewFoodServingSize('');
      addFoodModal.close();
      
      Alert.alert('Success', 'Food added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
    }
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity('');
    addEntryModal.open();
  };

  const handleAddEntry = async () => {
    if (!selectedFood || !quantity) {
      Alert.alert('Error', 'Please enter a quantity.');
      return;
    }

    try {
      await addFoodEntry({
        foodId: selectedFood.id,
        food: selectedFood,
        quantity: parseFloat(quantity),
        quantityUnit,
        mealType,
        loggedAt: new Date(),
      });

      addEntryModal.close();
      setSelectedFood(null);
      setQuantity('');
      
      Alert.alert('Success', 'Food added to log!', [
        { text: 'Add Another', style: 'default' },
        { 
          text: 'View Log', 
          style: 'default',
          onPress: () => navigation.navigate('FoodLog')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add food entry. Please try again.');
    }
  };

  const calculateDisplayCalories = () => {
    if (!selectedFood || !quantity) return 0;
    
    const mockEntry = {
      id: 'temp',
      foodId: selectedFood.id,
      food: selectedFood,
      quantity: parseFloat(quantity),
      quantityUnit,
      mealType: 'breakfast' as MealType,
      loggedAt: new Date(),
    };
    
    return Math.round(calculateEntryNutrition(mockEntry).calories);
  };

  const mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  const handleAIAnalysis = (result: {
    name: string;
    brand?: string;
    servingSize?: number;
    nutritionPer100g: NutritionInfo;
    confidence: number;
    reasoning?: string;
  }) => {
    // Pre-populate the form with AI results
    setNewFoodName(result.name);
    setNewFoodBrand(result.brand || '');
    setNewFoodCalories(result.nutritionPer100g.calories.toString());
    setNewFoodProtein(result.nutritionPer100g.protein.toString());
    setNewFoodCarbs(result.nutritionPer100g.carbs.toString());
    setNewFoodFat(result.nutritionPer100g.fat.toString());
    setNewFoodServingSize(result.servingSize?.toString() || '');
    
    // Open the add food modal for review/editing
    addFoodModal.open();
  };

  const handleRequestApiKey = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search foods..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <View style={styles.topButtonRow}>
          <Button 
            mode="outlined" 
            onPress={addFoodModal.open}
            style={styles.actionButton}
            icon="plus"
          >
            Create Food
          </Button>
          <Button 
            mode="outlined" 
            onPress={aiAnalysisModal.open}
            style={styles.actionButton}
            icon="robot-outline"
          >
            AI Analysis
          </Button>
        </View>
        <View style={styles.bottomButtonRow}>
          <Button 
            mode="outlined" 
            onPress={() => Alert.alert('Coming Soon', 'Barcode scanning will be available soon!')}
            style={styles.bottomActionButton}
            icon="qrcode-scan"
          >
            Scan Barcode
          </Button>
        </View>
      </View>

      {/* Search Results */}
      <ScrollView style={styles.resultsContainer}>
        {searchQuery.trim() ? (
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Search Results ({filteredFoods.length})
          </Text>
        ) : (
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Foods
          </Text>
        )}
        
        {filteredFoods.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery.trim() ? 'No foods found.' : 'No foods added yet.'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubText}>
                {searchQuery.trim() 
                  ? 'Try a different search or create a new food.'
                  : 'Start by creating your first food item.'
                }
              </Text>
              <Button 
                mode="contained" 
                onPress={addFoodModal.open}
                style={styles.createButton}
                icon="plus"
              >
                Create Food
              </Button>
            </Card.Content>
          </Card>
        ) : (
          filteredFoods.map((food) => (
            <Card key={food.id} style={styles.foodCard}>
              <List.Item
                title={food.name}
                description={
                  <View>
                    <Text variant="bodyMedium">
                      {Math.round(food.nutritionPer100g.calories)} cal/100g • 
                      {Math.round(food.nutritionPer100g.protein)}g protein
                    </Text>
                    {food.brand && (
                      <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                        {food.brand}
                      </Text>
                    )}
                  </View>
                }
                right={(props) => (
                  <Button 
                    mode="contained" 
                    onPress={() => handleSelectFood(food)}
                    compact
                  >
                    Add
                  </Button>
                )}
                onPress={() => handleSelectFood(food)}
              />
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Food Modal */}
      <FormModal
        visible={addFoodModal.visible}
        onDismiss={addFoodModal.close}
        title="Create New Food"
        onSubmit={handleAddFood}
        submitLabel="Create"
      >
        <TextInput
          label="Food Name *"
          value={newFoodName}
          onChangeText={setNewFoodName}
          style={commonStyles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Brand (optional)"
          value={newFoodBrand}
          onChangeText={setNewFoodBrand}
          style={commonStyles.input}
          mode="outlined"
        />
        
        <Text variant="titleSmall" style={commonStyles.sectionLabel}>
          Nutrition per 100g
        </Text>
        
        <TextInput
          label="Calories *"
          value={newFoodCalories}
          onChangeText={setNewFoodCalories}
          style={commonStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <View style={commonStyles.macroRow}>
          <TextInput
            label="Protein (g)"
            value={newFoodProtein}
            onChangeText={setNewFoodProtein}
            style={[commonStyles.input, commonStyles.macroInput]}
            mode="outlined"
            keyboardType="numeric"
          />
          <TextInput
            label="Carbs (g)"
            value={newFoodCarbs}
            onChangeText={setNewFoodCarbs}
            style={[commonStyles.input, commonStyles.macroInput]}
            mode="outlined"
            keyboardType="numeric"
          />
          <TextInput
            label="Fat (g)"
            value={newFoodFat}
            onChangeText={setNewFoodFat}
            style={[commonStyles.input, commonStyles.macroInput]}
            mode="outlined"
            keyboardType="numeric"
          />
        </View>
        
        <TextInput
          label="Serving Size (g, optional)"
          value={newFoodServingSize}
          onChangeText={setNewFoodServingSize}
          style={commonStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
      </FormModal>

      {/* Add Entry Modal */}
      <FormModal
        visible={addEntryModal.visible}
        onDismiss={addEntryModal.close}
        title={selectedFood ? `Add ${selectedFood.name}` : 'Add Food'}
        onSubmit={handleAddEntry}
        submitLabel="Add to Log"
        submitDisabled={!quantity}
      >
        {selectedFood && (
          <>
            {selectedFood.brand && (
              <Text variant="bodyMedium" style={styles.brandText}>
                {selectedFood.brand}
              </Text>
            )}
            
            <Text variant="bodyLarge" style={styles.nutritionInfo}>
              {Math.round(selectedFood.nutritionPer100g.calories)} cal/100g • 
              {Math.round(selectedFood.nutritionPer100g.protein)}g protein
            </Text>
            
            <Divider style={styles.divider} />
            
            <TextInput
              label={`Quantity (${quantityUnit})`}
              value={quantity}
              onChangeText={setQuantity}
              style={commonStyles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <Text variant="titleSmall" style={commonStyles.sectionLabel}>
              Unit
            </Text>
            <SegmentedButtons
              value={quantityUnit}
              onValueChange={(value) => setQuantityUnit(value as 'grams' | 'servings')}
              buttons={[
                { value: 'grams', label: 'Grams' },
                { value: 'servings', label: 'Servings' },
              ]}
              style={commonStyles.segmentedButtons}
            />
            
            <Text variant="titleSmall" style={commonStyles.sectionLabel}>
              Meal
            </Text>
            <SegmentedButtons
              value={mealType}
              onValueChange={(value) => setMealType(value as MealType)}
              buttons={mealTypeOptions}
              style={commonStyles.segmentedButtons}
            />
            
            {quantity && (
              <Card style={styles.previewCard}>
                <Card.Content>
                  <Text variant="titleMedium">Preview</Text>
                  <Text variant="bodyLarge" style={styles.previewCalories}>
                    {calculateDisplayCalories()} calories
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}
              </FormModal>

      {/* AI Analysis Modal */}
      <FormModal
        visible={aiAnalysisModal.visible}
        onDismiss={aiAnalysisModal.close}
        title="🤖 AI Food Analysis"
        onSubmit={() => {}} // No submit needed, handled internally
        submitLabel=""
        cancelLabel="Close"
      >
        <AIFoodAnalyzer
          apiKey={chatGptApiKey}
          onAnalysisComplete={(result) => {
            handleAIAnalysis(result);
            aiAnalysisModal.close();
          }}
          onRequestApiKey={() => {
            aiAnalysisModal.close();
            handleRequestApiKey();
          }}
          isModal={true}
        />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  quickActions: {
    marginBottom: 16,
  },
  topButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bottomButtonRow: {
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  bottomActionButton: {
    minWidth: '48%',
  },
  resultsContainer: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  createButton: {
    alignSelf: 'center',
  },
  foodCard: {
    marginBottom: 8,
  },
  brandText: {
    opacity: 0.7,
    marginBottom: 4,
  },
  nutritionInfo: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  previewCard: {
    marginTop: 16,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  previewCalories: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#6200EE',
  },
});