import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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
import type { FoodLogScreenProps } from '../../types/navigation';
import type { Food, MealType, NutritionInfo } from '../../types/nutrition';
import { calculateEntryNutrition } from '../../utils/nutritionCalculators';
import { FormModal, AIFoodAnalyzer, BarcodeScanner, ProductPreview } from '../../components';
import { useFormModal } from '../../hooks/useFormModal';
import { useFormState } from '../../hooks/useFormState';
import { showError, showMultiOptionAlert } from '../../utils/alertUtils';
import { showSuccess } from '../../utils/errorHandler';
import { sharedStyles, spacing } from '../../utils/sharedStyles';
import { formatTimeDisplay } from '../../utils/dateHelpers';
import { fetchProductByBarcode, searchProducts } from '../../services/openFoodFacts';
import type { ParsedProduct, SearchResult } from '../../services/openFoodFacts';
import { openFoodFactsRateLimiter } from '../../utils/rateLimiter';

function SearchScreen({ navigation }: FoodLogScreenProps<'Search'>) {
  const theme = useTheme();
  
SearchScreen.displayName = 'SearchScreen';
  const { foods, searchFoods, addFood, addFoodEntry, loadFoods, chatGptApiKey } = useNutritionStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [apiSearchResults, setApiSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchedQueryRef = useRef<string>('');

  const performApiSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      return;
    }

    // Record request in rate limiter
    if (!openFoodFactsRateLimiter.recordRequest()) {
      setApiSearchError('Rate limit reached. Please wait a moment before searching again.');
      setIsSearchingAPI(false);
      return;
    }

    setIsSearchingAPI(true);
    setApiSearchError(null);
    lastSearchedQueryRef.current = query;

    try {
      const results = await searchProducts(query, 20);
      setApiSearchResults(results);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed');
      setApiSearchError(error.message);
      setApiSearchResults([]);
    } finally {
      setIsSearchingAPI(false);
    }
  }, []);

  // Debounced OpenFoodFacts search - directly using searchQuery
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    const trimmedQuery = searchQuery.trim();

    // Don't search if query is too short
    if (trimmedQuery.length < 2) {
      // Clear API results when query is cleared
      setApiSearchResults(prev => prev.length > 0 ? [] : prev);
      setIsSearchingAPI(prev => prev ? false : prev);
      setApiSearchError(prev => prev ? null : prev);
      lastSearchedQueryRef.current = '';
      return;
    }

    // Don't search if it's the same query as last time
    if (trimmedQuery === lastSearchedQueryRef.current) {
      return;
    }

    // Set up debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      // Check rate limit
      if (!openFoodFactsRateLimiter.canMakeRequest()) {
        const waitTime = openFoodFactsRateLimiter.getTimeUntilNextRequest();
        if (waitTime > 0) {
          // Schedule for later
          searchTimeoutRef.current = setTimeout(() => {
            performApiSearch(trimmedQuery);
          }, waitTime);
          return;
        }
      }

      await performApiSearch(trimmedQuery);
    }, 600);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchQuery, performApiSearch]);
  
  // Ensure foods are loaded when component mounts and when screen comes into focus
  useEffect(() => {
    const loadData = () => {
      loadFoods();
    };
    
    // Load on mount
    loadData();
    
    // Reload when screen comes into focus (handles refresh/navigation)
    const unsubscribe = navigation.addListener('focus', loadData);
    
    return unsubscribe;
  }, [navigation]);
  const addFoodModal = useFormModal();
  const addEntryModal = useFormModal();
  const aiAnalysisModal = useFormModal();
  const barcodeScannerModal = useFormModal();
  const productPreviewModal = useFormModal();
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ParsedProduct | null>(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // Add Food Form State
  const addFoodForm = useFormState({
    name: '',
    brand: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingDescription: ''
  });
  
  // Add Entry Form State
  const addEntryForm = useFormState({
    quantity: '',
    selectedTime: new Date(),
    showTimePicker: false
  });
  
  // AI Analysis tracking state
  const [isFromAIAnalysis, setIsFromAIAnalysis] = useState(false);
  const [originalAIInput, setOriginalAIInput] = useState<{
    description: string;
    image: string | null;
  }>({ description: '', image: null });

  // Deduplicate foods by ID (and optionally by name+brand for true duplicates)
  const deduplicateFoods = (foodList: Food[]): Food[] => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>(); // For name+brand deduplication
    
    return foodList.filter(food => {
      // First check: deduplicate by ID
      if (seenIds.has(food.id)) {
        return false;
      }
      seenIds.add(food.id);
      
      // Second check: deduplicate by name+brand (case-insensitive)
      // This catches cases where the same food was added multiple times with different IDs
      const key = `${food.name.toLowerCase()}_${(food.brand || '').toLowerCase()}`;
      if (seenKeys.has(key)) {
        return false;
      }
      seenKeys.add(key);
      
      return true;
    });
  };

  // Convert API search results to Food format for display (memoized to prevent recreating dates)
  const convertSearchResultToFood = useCallback((result: SearchResult): Food => {
    const now = new Date();
    return {
      id: `off-${result.barcode}`,
      name: result.name,
      brand: result.brand,
      barcode: result.barcode,
      nutritionPerServing: result.nutritionPerServing,
      servingDescription: result.servingSize,
      category: 'other',
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Search local foods
      const localResults = searchFoods(searchQuery);
      const localFoods = deduplicateFoods(localResults);
      
      // Combine with API results (convert to Food format)
      const apiFoods = apiSearchResults
        .map(convertSearchResultToFood)
        .filter(apiFood => {
          // Filter out duplicates (check if local foods already have this barcode or name+brand)
          return !localFoods.some(localFood => 
            localFood.barcode === apiFood.barcode ||
            (localFood.name.toLowerCase() === apiFood.name.toLowerCase() &&
             localFood.brand?.toLowerCase() === apiFood.brand?.toLowerCase())
          );
        });
      
      // Combine and deduplicate
      const allFoods = [...localFoods, ...apiFoods];
      setFilteredFoods(deduplicateFoods(allFoods));
    } else {
      // Show recent foods, deduplicated
      const uniqueFoods = deduplicateFoods(foods);
      setFilteredFoods(uniqueFoods.slice(0, 20));
      // Only clear API results if they're not already empty to avoid unnecessary updates
      if (apiSearchResults.length > 0) {
        setApiSearchResults([]);
      }
    }
  }, [searchQuery, foods, apiSearchResults, convertSearchResultToFood]);

  const handleAddFood = async () => {
    const formValues = addFoodForm.getFormValues();
    
    if (!formValues.name.trim() || !formValues.calories || !formValues.servingDescription.trim()) {
      showError('Please fill in the food name, calories, and serving description.');
      return;
    }

    try {
      const nutritionInfo: NutritionInfo = {
        calories: parseFloat(formValues.calories) || 0,
        protein: parseFloat(formValues.protein) || 0,
        carbs: parseFloat(formValues.carbs) || 0,
        fat: parseFloat(formValues.fat) || 0,
      };

      await addFood({
        name: formValues.name.trim(),
        brand: formValues.brand.trim() || undefined,
        nutritionPerServing: nutritionInfo,
        servingDescription: formValues.servingDescription.trim(),
        category: 'other',
      });

      // Reset form
      addFoodForm.resetForm();
      setIsFromAIAnalysis(false);
      setOriginalAIInput({ description: '', image: null });
      addFoodModal.close();
      
      showSuccess('Food added successfully!');
    } catch (error) {
      showError('Failed to add food. Please try again.');
    }
  };

  const handleSelectFood = async (food: Food) => {
    // If food is from API (not in our database yet), save it first
    if (food.id.startsWith('off-')) {
      try {
        // Check if food already exists by barcode
        let existingFood = foods.find(f => f.barcode === food.barcode);
        
        if (!existingFood) {
          // Add food to database
          await addFood({
            name: food.name,
            brand: food.brand,
            barcode: food.barcode,
            nutritionPerServing: food.nutritionPerServing,
            servingDescription: food.servingDescription,
            category: food.category || 'other',
          });
          
          // Reload foods to get the new food with proper ID
          await loadFoods();
          const storeState = useNutritionStore.getState();
          existingFood = storeState.foods.find(f => f.barcode === food.barcode);
        }
        
        if (existingFood) {
          setSelectedFood(existingFood);
        } else {
          // Fallback: use the API food as-is (shouldn't happen, but just in case)
          setSelectedFood(food);
        }
      } catch (error) {
        console.error('Error saving API food:', error);
        showError('Failed to save food. Please try again.');
        return;
      }
    } else {
      setSelectedFood(food);
    }
    
    addEntryForm.quantity.setValue('');
    addEntryForm.selectedTime.setValue(new Date()); // Reset to current time when selecting new food
    addEntryModal.open();
  };

  const handleAddEntry = async () => {
    const entryValues = addEntryForm.getFormValues();
    
    if (!selectedFood || !entryValues.quantity) {
      showError('Please enter a quantity.');
      return;
    }

    try {
      const inferredMealType = inferMealTypeFromTime(entryValues.selectedTime);
      
      await addFoodEntry({
        foodId: selectedFood.id,
        food: selectedFood,
        quantity: parseFloat(entryValues.quantity),
        mealType: inferredMealType,
        loggedAt: entryValues.selectedTime,
      });

      addEntryModal.close();
      setSelectedFood(null);
      addEntryForm.quantity.setValue('');
      
      // Success toast is shown by the store automatically
    } catch (error) {
      showError('Failed to add food entry. Please try again.');
    }
  };

  const calculateDisplayCalories = () => {
    const entryValues = addEntryForm.getFormValues();
    
    if (!selectedFood || !entryValues.quantity) return 0;
    
    const mockEntry = {
      id: 'temp',
      foodId: selectedFood.id,
      food: selectedFood,
      quantity: parseFloat(entryValues.quantity),
      mealType: inferMealTypeFromTime(entryValues.selectedTime),
      loggedAt: entryValues.selectedTime,
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
    addFoodForm.setFormValues({
      name: result.name,
      brand: result.brand || '',
      calories: result.nutrition.calories.toString(),
      protein: result.nutrition.protein.toString(),
      carbs: result.nutrition.carbs.toString(),
      fat: result.nutrition.fat.toString(),
      servingDescription: result.servingSize,
    });
    
    // Mark that this form was populated by AI analysis and store original input
    setIsFromAIAnalysis(true);
    setOriginalAIInput(originalInput);
    
    // Open the add food modal for review/editing
    addFoodModal.open();
    
    // Show helpful info about the analysis
    showMultiOptionAlert({
      title: 'AI Analysis Complete!',
      message: `Analyzed "${result.name}"\n\n` +
        `Serving Size: ${result.servingSize}\n` +
        `Confidence: ${Math.round(result.confidence * 100)}%\n\n` +
        `Reasoning: ${result.reasoning}\n\n` +
        `You can review and edit the values before saving.`,
      options: [{ text: 'Got it!', style: 'default', onPress: () => {} }]
    });
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
    
    // Sort chronologically (earliest to latest)
    return times.sort((a, b) => {
      return a.getTime() - b.getTime();
    });
  };

  const timeOptions = generateTimeOptions();

  const handleTimeSelect = (time: Date) => {
    addEntryForm.selectedTime.setValue(time);
    addEntryForm.showTimePicker.setValue(false);
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
    <View style={[sharedStyles.containerWithPadding, { backgroundColor: theme.colors.background }]}>
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
                            style={sharedStyles.actionButton}
            icon="plus"
          >
            Create Food
          </Button>
          <Button 
            mode="outlined" 
            onPress={aiAnalysisModal.open}
                            style={sharedStyles.actionButton}
            icon="robot-outline"
          >
            AI Analysis
          </Button>
        </View>
        <View style={styles.bottomButtonRow}>
          <Button 
            mode="outlined" 
            onPress={barcodeScannerModal.open}
            style={styles.bottomActionButton}
            icon="qrcode-scan"
          >
            Scan Barcode
          </Button>
        </View>
      </View>

      {/* Search Results */}
      <ScrollView style={sharedStyles.flex1}>
        {searchQuery.trim() ? (
          <View style={styles.searchHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Search Results ({filteredFoods.length})
            </Text>
            {isSearchingAPI && (
              <Text variant="bodySmall" style={styles.searchingText}>
                Searching OpenFoodFacts...
              </Text>
            )}
            {apiSearchError && (
              <Text variant="bodySmall" style={styles.errorText}>
                {apiSearchError}
              </Text>
            )}
          </View>
        ) : (
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Foods
          </Text>
        )}
        
        {filteredFoods.length === 0 && !isSearchingAPI ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={sharedStyles.emptyTitle}>
                {searchQuery.trim() ? 'No foods found.' : 'No foods added yet.'}
              </Text>
              <Text variant="bodyMedium" style={sharedStyles.emptySubtitle}>
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
          <>
            {filteredFoods.map((food) => {
              const isFromAPI = food.id.startsWith('off-');
              return (
                <Card key={food.id} style={sharedStyles.smallCardSpacing}>
                  <List.Item
                    title={food.name}
                    description={
                      <View>
                        <View style={styles.foodDescriptionRow}>
                          <Text variant="bodyMedium">
                            {Math.round(food.nutritionPerServing?.calories)} cal per {food.servingDescription} • 
                            {Math.round(food.nutritionPerServing?.protein)}g protein
                          </Text>
                          {isFromAPI && (
                            <Text variant="bodySmall" style={styles.apiBadge}>
                              OpenFoodFacts
                            </Text>
                          )}
                        </View>
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
              );
            })}
            {isSearchingAPI && filteredFoods.length > 0 && (
              <Card style={sharedStyles.smallCardSpacing}>
                <Card.Content>
                  <Text variant="bodyMedium" style={styles.loadingText}>
                    Searching for more results...
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
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
          value={addFoodForm.name.value}
          onChangeText={addFoodForm.name.setValue}
          style={sharedStyles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Brand (optional)"
          value={addFoodForm.brand.value}
          onChangeText={addFoodForm.brand.setValue}
          style={sharedStyles.input}
          mode="outlined"
        />
        
        <Text variant="titleSmall" style={sharedStyles.sectionLabel}>
          Nutrition per serving
        </Text>
        
        <TextInput
          label="Calories *"
          value={addFoodForm.calories.value}
          onChangeText={addFoodForm.calories.setValue}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <View style={sharedStyles.macroRow}>
          <TextInput
            label="Protein (g)"
            value={addFoodForm.protein.value}
            onChangeText={addFoodForm.protein.setValue}
            style={[sharedStyles.input, sharedStyles.macroInput]}
            mode="outlined"
            keyboardType="numeric"
          />
          <TextInput
            label="Carbs (g)"
            value={addFoodForm.carbs.value}
            onChangeText={addFoodForm.carbs.setValue}
            style={[sharedStyles.input, sharedStyles.macroInput]}
            mode="outlined"
            keyboardType="numeric"
          />
          <TextInput
            label="Fat (g)"
            value={addFoodForm.fat.value}
            onChangeText={addFoodForm.fat.setValue}
            style={[sharedStyles.input, sharedStyles.macroInput]}
            mode="outlined"
            keyboardType="numeric"
          />
        </View>
        
        <TextInput
          label="Serving Description *"
          value={addFoodForm.servingDescription.value}
          onChangeText={addFoodForm.servingDescription.setValue}
          style={sharedStyles.input}
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
        submitDisabled={!addEntryForm.quantity.value}
      >
        {selectedFood && (
          <>
            {selectedFood.brand && (
              <Text variant="bodyMedium" style={sharedStyles.brandText}>
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
              value={addEntryForm.quantity.value}
              onChangeText={addEntryForm.quantity.setValue}
              style={sharedStyles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="e.g., 1, 2, 0.5"
            />

            <Text variant="titleSmall" style={sharedStyles.sectionLabel}>
              Time Consumed
            </Text>
            <TouchableRipple
              onPress={() => addEntryForm.showTimePicker.setValue(true)}
              style={styles.timePickerButton}
            >
              <View style={styles.timePickerContent}>
                <IconButton icon="clock-outline" size={20} />
                <View style={styles.timeDisplayContent}>
                  <Text variant="bodyLarge">{formatTimeDisplay(addEntryForm.selectedTime.value)}</Text>
                  <Text variant="bodySmall" style={styles.inferredMealType}>
                    Will be logged as {inferMealTypeFromTime(addEntryForm.selectedTime.value)}
                  </Text>
                </View>
                <IconButton icon="chevron-down" size={20} />
              </View>
            </TouchableRipple>
            
            {addEntryForm.quantity.value && (
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
          visible={addEntryForm.showTimePicker.value}
          onDismiss={() => addEntryForm.showTimePicker.setValue(false)}
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
                  formatTimeDisplay(time) === formatTimeDisplay(addEntryForm.selectedTime.value) && 
                  { backgroundColor: theme.colors.primaryContainer }
                ]}
              >
                <Text 
                  variant="bodyLarge"
                  style={[
                    styles.timeOptionText,
                    formatTimeDisplay(time) === formatTimeDisplay(addEntryForm.selectedTime.value) && 
                    { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }
                  ]}
                >
                  {formatTimeDisplay(time)}
                </Text>
              </TouchableRipple>
            ))}
          </ScrollView>
          <View style={styles.timePickerActions}>
            <Button mode="outlined" onPress={() => addEntryForm.showTimePicker.setValue(false)}>
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

      {/* Barcode Scanner Modal */}
      <FormModal
        visible={barcodeScannerModal.visible}
        onDismiss={barcodeScannerModal.close}
        title="📷 Scan Barcode"
        onSubmit={() => {}} // No submit needed, handled internally
        submitLabel=""
        cancelLabel=""
      >
        <BarcodeScanner
          onScan={async (barcode) => {
            barcodeScannerModal.close();
            setIsFetchingProduct(true);
            
            try {
              const product = await fetchProductByBarcode(barcode);
              
              if (product) {
                setScannedProduct(product);
                productPreviewModal.open();
              } else {
                showError('Product not found in Open Food Facts database. You can still search for it manually.');
                setSearchQuery(barcode);
              }
            } catch (error) {
              console.error('Error fetching product:', error);
              showError('Failed to fetch product information. You can still search for it manually.');
              setSearchQuery(barcode);
            } finally {
              setIsFetchingProduct(false);
            }
          }}
          onCancel={barcodeScannerModal.close}
        />
      </FormModal>

      {/* Product Preview Modal */}
      <FormModal
        visible={productPreviewModal.visible}
        onDismiss={productPreviewModal.close}
        title="📦 Product Found"
        onSubmit={() => {}} // No submit needed, handled internally
        submitLabel=""
        cancelLabel=""
      >
        {scannedProduct && (
          <ProductPreview
            product={scannedProduct}
            isLoading={isAddingProduct}
            onAddToLog={async (quantity) => {
              setIsAddingProduct(true);
              try {
                // First, ensure the food exists in our database
                let food = foods.find(f => f.barcode === scannedProduct.barcode);
                
                if (!food) {
                  // Add food to database first
                  await addFood({
                    name: scannedProduct.name,
                    brand: scannedProduct.brand,
                    barcode: scannedProduct.barcode,
                    nutritionPerServing: scannedProduct.nutritionPerServing,
                    servingDescription: scannedProduct.servingSize,
                    category: 'other',
                  });
                  
                  // Reload foods to get the new food
                  await loadFoods();
                  // Get updated foods from store - access store directly
                  const storeState = useNutritionStore.getState();
                  food = storeState.foods.find(f => f.barcode === scannedProduct.barcode);
                  
                  if (!food) {
                    throw new Error('Failed to create food');
                  }
                }
                
                // Add entry to log
                const currentTime = new Date();
                const inferredMealType = inferMealTypeFromTime(currentTime);
                
                await addFoodEntry({
                  foodId: food.id,
                  food: food,
                  quantity: quantity,
                  mealType: inferredMealType,
                  loggedAt: currentTime,
                });
                
                productPreviewModal.close();
                setScannedProduct(null);
                showSuccess(`Added ${scannedProduct.name} to your log!`);
              } catch (error) {
                console.error('Error adding product to log:', error);
                showError('Failed to add product to log. Please try again.');
              } finally {
                setIsAddingProduct(false);
              }
            }}
            onCancel={() => {
              productPreviewModal.close();
              setScannedProduct(null);
            }}
          />
        )}
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Removed container - using sharedStyles.containerWithPadding
  searchBar: {
    marginBottom: spacing.lg,
  },
  quickActions: {
    marginBottom: spacing.lg,
  },
  topButtonRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  bottomButtonRow: {
    alignItems: 'center',
  },
  // Removed actionButton - using sharedStyles.actionButton
  bottomActionButton: {
    minWidth: '48%',
  },
  // Removed resultsContainer - using sharedStyles.flex1
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    marginTop: 32,
  },
  // Removed emptyText and emptySubText - using shared empty state styles
  createButton: {
    alignSelf: 'center',
  },
  // Removed foodCard - using sharedStyles.smallCardSpacing
  // Removed brandText - using sharedStyles.brandText
  nutritionInfo: {
    marginBottom: spacing.lg,
  },
  divider: {
    marginVertical: spacing.lg,
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
    marginBottom: spacing.lg,
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
    marginVertical: spacing.lg,
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
  searchHeader: {
    marginBottom: 12,
  },
  searchingText: {
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 4,
  },
  foodDescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiBadge: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
    overflow: 'hidden',
  },
  loadingText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
});

export default SearchScreen;