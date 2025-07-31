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
  Modal,
  Portal,
  TextInput,
  SegmentedButtons,
  Divider
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { SearchScreenProps } from '../../types/navigation';
import type { Food, MealType, NutritionInfo } from '../../types/nutrition';

export default function SearchScreen({ navigation }: SearchScreenProps<'SearchHome'>) {
  const theme = useTheme();
  const { foods, searchFoods, addFood, addFoodEntry } = useNutritionStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
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
      setShowAddFoodModal(false);
      
      Alert.alert('Success', 'Food added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
    }
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity('');
    setShowAddEntryModal(true);
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

      setShowAddEntryModal(false);
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
    
    const multiplier = quantityUnit === 'grams' 
      ? parseFloat(quantity) / 100 
      : parseFloat(quantity) * (selectedFood.servingSize || 100) / 100;
    
    return Math.round(selectedFood.nutritionPer100g.calories * multiplier);
  };

  const mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

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
        <Button 
          mode="outlined" 
          onPress={() => setShowAddFoodModal(true)}
          style={styles.actionButton}
          icon="plus"
        >
          Create Food
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => Alert.alert('Coming Soon', 'Barcode scanning will be available soon!')}
          style={styles.actionButton}
          icon="qrcode-scan"
        >
          Scan Barcode
        </Button>
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
                onPress={() => setShowAddFoodModal(true)}
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
      <Portal>
        <Modal
          visible={showAddFoodModal}
          onDismiss={() => setShowAddFoodModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Create New Food</Title>
            
            <TextInput
              label="Food Name *"
              value={newFoodName}
              onChangeText={setNewFoodName}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Brand (optional)"
              value={newFoodBrand}
              onChangeText={setNewFoodBrand}
              style={styles.input}
              mode="outlined"
            />
            
            <Text variant="titleSmall" style={styles.sectionLabel}>
              Nutrition per 100g
            </Text>
            
            <TextInput
              label="Calories *"
              value={newFoodCalories}
              onChangeText={setNewFoodCalories}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <View style={styles.macroRow}>
              <TextInput
                label="Protein (g)"
                value={newFoodProtein}
                onChangeText={setNewFoodProtein}
                style={[styles.input, styles.macroInput]}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Carbs (g)"
                value={newFoodCarbs}
                onChangeText={setNewFoodCarbs}
                style={[styles.input, styles.macroInput]}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Fat (g)"
                value={newFoodFat}
                onChangeText={setNewFoodFat}
                style={[styles.input, styles.macroInput]}
                mode="outlined"
                keyboardType="numeric"
              />
            </View>
            
            <TextInput
              label="Serving Size (g, optional)"
              value={newFoodServingSize}
              onChangeText={setNewFoodServingSize}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setShowAddFoodModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleAddFood}
                style={styles.modalButton}
              >
                Create
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Add Entry Modal */}
      <Portal>
        <Modal
          visible={showAddEntryModal}
          onDismiss={() => setShowAddEntryModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          {selectedFood && (
            <ScrollView>
              <Title style={styles.modalTitle}>Add {selectedFood.name}</Title>
              
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
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              
              <Text variant="titleSmall" style={styles.sectionLabel}>
                Unit
              </Text>
              <SegmentedButtons
                value={quantityUnit}
                onValueChange={(value) => setQuantityUnit(value as 'grams' | 'servings')}
                buttons={[
                  { value: 'grams', label: 'Grams' },
                  { value: 'servings', label: 'Servings' },
                ]}
                style={styles.segmentedButtons}
              />
              
              <Text variant="titleSmall" style={styles.sectionLabel}>
                Meal
              </Text>
              <SegmentedButtons
                value={mealType}
                onValueChange={(value) => setMealType(value as MealType)}
                buttons={mealTypeOptions}
                style={styles.segmentedButtons}
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
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowAddEntryModal(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleAddEntry}
                  style={styles.modalButton}
                  disabled={!quantity}
                >
                  Add to Log
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
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
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
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
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
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
  segmentedButtons: {
    marginBottom: 16,
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