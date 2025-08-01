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
  Divider,
  IconButton,
  TouchableRipple,
  Modal,
  Portal
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { SearchScreenProps } from '../../types/navigation';
import type { Food, MealType, NutritionInfo } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import { FormModal, AIFoodAnalyzer } from '../../components';
import { useFormModal } from '../../hooks/useFormModal';
import { commonStyles } from '../../utils/commonStyles';
import { format } from 'date-fns';

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
  const [newFoodServingDescription, setNewFoodServingDescription] = useState('');
  
  // Add Entry Form State
  const [quantity, setQuantity] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // AI Analysis tracking state
  const [isFromAIAnalysis, setIsFromAIAnalysis] = useState(false);
  const [originalAIInput, setOriginalAIInput] = useState<{
    description: string;
    image: string | null;
  }>({ description: '', image: null });

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredFoods(searchFoods(searchQuery));
    } else {
      setFilteredFoods(foods.slice(0, 20)); // Show recent foods
    }
  }, [searchQuery, foods]);

  const handleAddFood = async () => {
    if (!newFoodName.trim() || !newFoodCalories || !newFoodServingDescription.trim()) {
      Alert.alert('Error', 'Please fill in the food name, calories, and serving description.');
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
        nutritionPerServing: nutritionInfo,
        servingDescription: newFoodServingDescription.trim(),
        category: 'other',
      });

      // Reset form
      setNewFoodName('');
      setNewFoodBrand('');
      setNewFoodCalories('');
      setNewFoodProtein('');
      setNewFoodCarbs('');
      setNewFoodFat('');
      setNewFoodServingDescription('');
      setIsFromAIAnalysis(false);
      setOriginalAIInput({ description: '', image: null });
      addFoodModal.close();
      
      Alert.alert('Success', 'Food added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
    }
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity('');
    setSelectedTime(new Date()); // Reset to current time when selecting new food
    addEntryModal.open();
  };

  const handleAddEntry = async () => {
    if (!selectedFood || !quantity) {
      Alert.alert('Error', 'Please enter a quantity.');
      return;
    }

    try {
      const inferredMealType = inferMealTypeFromTime(selectedTime);
      
      await addFoodEntry({
        foodId: selectedFood.id,
        food: selectedFood,
        quantity: parseFloat(quantity),
        mealType: inferredMealType,
        loggedAt: selectedTime,
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
      mealType: inferMealTypeFromTime(selectedTime),
      loggedAt: selectedTime,
    };
    
    return Math.round(calculateEntryNutrition(mockEntry).calories);
  };



  const handleAIAnalysis = (result: {
    name: string;
    brand?: string;
    servingSize: string;
    nutrition: NutritionInfo;
    confidence: number;
    reasoning?: string;
  }, originalInput: { description: string; image: string | null }) => {
    // Pre-populate the form with AI results (keeping the original serving-based nutrition)
    setNewFoodName(result.name);
    setNewFoodBrand(result.brand || '');
    setNewFoodCalories(result.nutrition.calories.toString());
    setNewFoodProtein(result.nutrition.protein.toString());
    setNewFoodCarbs(result.nutrition.carbs.toString());
    setNewFoodFat(result.nutrition.fat.toString());
    setNewFoodServingDescription(result.servingSize);
    
    // Mark that this form was populated by AI analysis and store original input
    setIsFromAIAnalysis(true);
    setOriginalAIInput(originalInput);
    
    // Open the add food modal for review/editing
    addFoodModal.open();
    
    // Show helpful info about the analysis
    Alert.alert(
      'AI Analysis Complete!',
      `Analyzed "${result.name}"\n\n` +
      `Serving Size: ${result.servingSize}\n` +
      `Confidence: ${Math.round(result.confidence * 100)}%\n\n` +
      `Reasoning: ${result.reasoning}\n\n` +
      `You can review and edit the values before saving.`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const handleRequestApiKey = () => {
    navigation.navigate('Profile');
  };

  const handleTryAgain = () => {
    // Close the add food modal
    addFoodModal.close();
    
    // Open the AI analysis modal with the original input pre-filled
    aiAnalysisModal.open();
  };

  const handleAddFoodModalDismiss = () => {
    // Reset AI analysis state when modal is dismissed
    setIsFromAIAnalysis(false);
    setOriginalAIInput({ description: '', image: null });
    
    // Close the modal
    addFoodModal.close();
  };

  const generateTimeOptions = () => {
    const times = [];
    const now = new Date();
    
    // Generate times for the current day only, every 30 minutes
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        times.push(date);
      }
    }
    
    // Sort times with current time and nearby times first
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return times.sort((a, b) => {
      const aDistance = Math.abs((a.getHours() * 60 + a.getMinutes()) - (currentHour * 60 + currentMinute));
      const bDistance = Math.abs((b.getHours() * 60 + b.getMinutes()) - (currentHour * 60 + currentMinute));
      return aDistance - bDistance;
    });
  };

  const timeOptions = generateTimeOptions();

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setShowTimePicker(false);
  };

  const formatTimeDisplay = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const inferMealTypeFromTime = (time: Date): MealType => {
    const hour = time.getHours();
    
    if (hour >= 5 && hour < 11) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      return 'lunch';
    } else if (hour >= 16 && hour < 22) {
      return 'dinner';
    } else {
      return 'snack'; // Late night or early morning
    }
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
                      {Math.round(food.nutritionPerServing?.calories)} cal per {food.servingDescription} • 
                      {Math.round(food.nutritionPerServing?.protein)}g protein
                    </Text>
                    {food.brand && (
                      <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                        {food.brand}
                      </Text>
                    )}
                  </View>
                }
                right={(props) => (
                  <IconButton 
                    icon="plus" 
                    mode="contained"
                    onPress={() => handleSelectFood(food)}
                    size={20}
                  />
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
        onDismiss={handleAddFoodModalDismiss}
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
          Nutrition per serving
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
          label="Serving Description *"
          value={newFoodServingDescription}
          onChangeText={setNewFoodServingDescription}
          style={commonStyles.input}
          mode="outlined"
          placeholder="e.g., 1 slice, 1 burger, 100g"
        />
        
        {/* Try Again button if form was populated by AI */}
        {isFromAIAnalysis && (
          <Button
            mode="outlined"
            onPress={handleTryAgain}
            style={styles.tryAgainButton}
            icon="robot-outline"
          >
            Try AI Analysis Again
          </Button>
        )}
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
              {Math.round(selectedFood.nutritionPerServing.calories)} cal per {selectedFood.servingDescription} • 
              {Math.round(selectedFood.nutritionPerServing.protein)}g protein
            </Text>
            
            <Divider style={styles.divider} />
            
            <TextInput
              label="How many servings?"
              value={quantity}
              onChangeText={setQuantity}
              style={commonStyles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="e.g., 1, 2, 0.5"
            />

            <Text variant="titleSmall" style={commonStyles.sectionLabel}>
              Time Consumed
            </Text>
            <TouchableRipple
              onPress={() => setShowTimePicker(true)}
              style={styles.timePickerButton}
            >
              <View style={styles.timePickerContent}>
                <IconButton icon="clock-outline" size={20} />
                <View style={styles.timeDisplayContent}>
                  <Text variant="bodyLarge">{formatTimeDisplay(selectedTime)}</Text>
                  <Text variant="bodySmall" style={styles.inferredMealType}>
                    Will be logged as {inferMealTypeFromTime(selectedTime)}
                  </Text>
                </View>
                <IconButton icon="chevron-down" size={20} />
              </View>
            </TouchableRipple>
            
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

      {/* Time Picker Modal */}
      <Portal>
        <Modal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          contentContainerStyle={[styles.timePickerModal, { backgroundColor: theme.colors.surface }]}
        >
          <Title>Select Time</Title>
          <ScrollView style={styles.timeOptionsContainer}>
            {timeOptions.map((time, index) => (
              <TouchableRipple
                key={index}
                onPress={() => handleTimeSelect(time)}
                style={[
                  styles.timeOption,
                  formatTimeDisplay(time) === formatTimeDisplay(selectedTime) && 
                  { backgroundColor: theme.colors.primaryContainer }
                ]}
              >
                <Text 
                  variant="bodyLarge"
                  style={[
                    styles.timeOptionText,
                    formatTimeDisplay(time) === formatTimeDisplay(selectedTime) && 
                    { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }
                  ]}
                >
                  {formatTimeDisplay(time)}
                </Text>
              </TouchableRipple>
            ))}
          </ScrollView>
          <View style={styles.timePickerActions}>
            <Button mode="outlined" onPress={() => setShowTimePicker(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={() => handleTimeSelect(new Date())}>
              Now
            </Button>
          </View>
        </Modal>
      </Portal>

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
          onAnalysisComplete={(result, originalInput) => {
            handleAIAnalysis(result, originalInput);
            aiAnalysisModal.close();
          }}
          onRequestApiKey={() => {
            aiAnalysisModal.close();
            handleRequestApiKey();
          }}
          isModal={true}
          initialDescription={originalAIInput.description}
          initialImage={originalAIInput.image}
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
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeDisplayContent: {
    flex: 1,
    alignItems: 'center',
  },
  inferredMealType: {
    opacity: 0.7,
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  timePickerModal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  timeOptionsContainer: {
    maxHeight: 300,
    marginVertical: 16,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  timeOptionText: {
    textAlign: 'center',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  tryAgainButton: {
    marginTop: 16,
    marginBottom: 8,
  },
});