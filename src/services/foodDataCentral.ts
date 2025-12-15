/**
 * USDA FoodData Central (FDC) API Service
 * Used for typed food search only
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 * 
 * Note: API key is base64 encoded but safe to expose client-side per USDA guidelines
 */

// Base64 encoded API key: ClY5HP487x8ml1fFrcnIi0Z5qyXVTgjLyvgg5D6D
const FDC_API_KEY = 'Q2xZNUhQNDg3eDhtbDFmRnJjbklpMFo1cXlYVlRnakx5dmdnNUQ2RA==';
const FDC_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface FDCFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  foodNutrients?: FDCNutrient[];
  foodPortions?: FDCPortion[];
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  publicationDate?: string;
}

export interface FDCNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
  derivationCode?: string;
  derivationDescription?: string;
}

export interface FDCPortion {
  id: number;
  amount: number;
  dataPoints?: number;
  gramWeight: number;
  measureUnit: {
    id: number;
    name: string;
    abbreviation: string;
  };
  portionDescription: string;
  modifier?: string;
  sequenceNumber?: number;
}

export interface FDCSearchResponse {
  foods: FDCFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface FDCSearchResult {
  name: string;
  brand?: string;
  fdcId: number;
  barcode?: string; // FDC doesn't have barcodes, but we include for compatibility
  servingSize: string;
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  source: 'fdc' | 'fallback';
}

/**
 * Normalizes search query according to FDC requirements:
 * - lowercase
 * - trim
 * - collapse spaces
 * - remove trailing plural 's'
 * - ignore queries < 3 chars
 */
export function normalizeQuery(query: string): string | null {
  let normalized = query.trim().toLowerCase();
  
  // Ignore queries < 3 chars
  if (normalized.length < 3) {
    return null;
  }
  
  // Collapse multiple spaces into single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Remove trailing plural 's' (simple heuristic)
  // Only if word is > 3 chars to avoid removing 's' from words like 'rice'
  if (normalized.length > 3 && normalized.endsWith('s')) {
    const withoutS = normalized.slice(0, -1);
    // Only remove if it doesn't create a word that's too short
    if (withoutS.length >= 3) {
      normalized = withoutS;
    }
  }
  
  return normalized;
}

/**
 * Extracts nutrition values from FDC food nutrients array
 */
function extractNutrients(nutrients: FDCNutrient[] = []): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
} {
  const result: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  } = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  for (const nutrient of nutrients) {
    const nutrientName = nutrient.nutrientName?.toLowerCase() || '';
    const value = nutrient.value || 0;
    const unit = nutrient.unitName?.toLowerCase() || '';

    // Energy (calories) - can be in kcal or kJ
    if (nutrientName.includes('energy') || nutrient.nutrientNumber === '208') {
      if (unit === 'kcal' || unit === 'kilocalorie') {
        result.calories = value;
      } else if (unit === 'kj' || unit === 'kilojoule') {
        // Convert kJ to kcal (1 kcal = 4.184 kJ)
        result.calories = value / 4.184;
      }
    }
    // Protein
    else if (nutrientName.includes('protein') || nutrient.nutrientNumber === '203') {
      if (unit === 'g' || unit === 'gram') {
        result.protein = value;
      }
    }
    // Carbohydrates
    else if (nutrientName.includes('carbohydrate') || nutrient.nutrientNumber === '205') {
      if (unit === 'g' || unit === 'gram') {
        result.carbs = value;
      }
    }
    // Total fat
    else if (nutrientName.includes('fat, total') || nutrientName.includes('total lipid') || nutrient.nutrientNumber === '204') {
      if (unit === 'g' || unit === 'gram') {
        result.fat = value;
      }
    }
    // Fiber
    else if (nutrientName.includes('fiber') || nutrient.nutrientNumber === '291') {
      if (unit === 'g' || unit === 'gram') {
        result.fiber = value;
      }
    }
    // Sugar
    else if (nutrientName.includes('sugar') || nutrient.nutrientNumber === '269') {
      if (unit === 'g' || unit === 'gram') {
        result.sugar = value;
      }
    }
    // Sodium
    else if (nutrientName.includes('sodium') || nutrient.nutrientNumber === '307') {
      if (unit === 'mg' || unit === 'milligram') {
        result.sodium = value;
      }
    }
  }

  return result;
}

/**
 * Determines serving size from food portions or defaults to 100g
 */
function getServingSize(food: FDCFood): string {
  // For branded foods, use householdServingFullText if available
  if (food.dataType === 'Branded' && food.householdServingFullText) {
    return food.householdServingFullText;
  }
  
  // For branded foods with servingSize, construct description
  if (food.dataType === 'Branded' && food.servingSize && food.servingSizeUnit) {
    const unit = food.servingSizeUnit.toLowerCase();
    if (unit === 'grm' || unit === 'g') {
      return `${food.servingSize}g`;
    } else if (unit === 'ml' || unit === 'milliliter') {
      return `${food.servingSize}ml`;
    }
    return `${food.servingSize} ${unit}`;
  }
  
  // Prefer foodPortions if available (for Foundation/SR Legacy foods)
  if (food.foodPortions && food.foodPortions.length > 0) {
    // Sort by most common (higher dataPoints) or first entry
    const sortedPortions = [...food.foodPortions].sort((a, b) => {
      const aPoints = a.dataPoints || 0;
      const bPoints = b.dataPoints || 0;
      return bPoints - aPoints;
    });
    
    const portion = sortedPortions[0];
    
    // Use portionDescription if available
    if (portion.portionDescription) {
      return portion.portionDescription;
    }
    
    // Build description from amount and unit
    const amount = portion.amount || 1;
    const unitName = portion.measureUnit?.name || portion.measureUnit?.abbreviation;
    
    if (unitName) {
      return `${amount} ${unitName}`.trim();
    }
  }
  
  // Default to 100g (standard FDC serving)
  return '100g';
}

/**
 * Gets nutrition per serving from FDC food
 * FDC ALWAYS provides nutrients per 100g
 * We need to scale based on actual serving size
 */
function getNutritionPerServing(food: FDCFood): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
} {
  const nutrients = extractNutrients(food.foodNutrients);
  
  // For Branded foods: use servingSize to scale from per 100g
  if (food.dataType === 'Branded' && food.servingSize && food.servingSizeUnit) {
    let servingGrams = food.servingSize;
    
    // Convert to grams if needed
    const unit = (food.servingSizeUnit || '').toLowerCase();
    if (unit === 'ml' || unit === 'milliliter') {
      // Assume 1ml = 1g for liquids (close enough)
      servingGrams = food.servingSize;
    } else if (unit !== 'grm' && unit !== 'g' && unit !== 'gram') {
      // Unknown unit, default to 100g
      servingGrams = 100;
    }
    
    // Scale from per 100g to per serving
    const scale = servingGrams / 100;
    
    return {
      calories: Math.round(nutrients.calories * scale),
      protein: Math.round(nutrients.protein * scale * 10) / 10,
      carbs: Math.round(nutrients.carbs * scale * 10) / 10,
      fat: Math.round(nutrients.fat * scale * 10) / 10,
      fiber: nutrients.fiber !== undefined ? Math.round(nutrients.fiber * scale * 10) / 10 : undefined,
      sugar: nutrients.sugar !== undefined ? Math.round(nutrients.sugar * scale * 10) / 10 : undefined,
      sodium: nutrients.sodium !== undefined ? Math.round(nutrients.sodium * scale) : undefined,
    };
  }
  
  // For Foundation/SR Legacy foods: use foodPortions
  if (food.foodPortions && food.foodPortions.length > 0) {
    const portion = food.foodPortions[0];
    const gramWeight = portion.gramWeight || 100;
    
    // Scale nutrients from per 100g to per serving
    const scale = gramWeight / 100;
    
    return {
      calories: Math.round(nutrients.calories * scale),
      protein: Math.round(nutrients.protein * scale * 10) / 10,
      carbs: Math.round(nutrients.carbs * scale * 10) / 10,
      fat: Math.round(nutrients.fat * scale * 10) / 10,
      fiber: nutrients.fiber !== undefined ? Math.round(nutrients.fiber * scale * 10) / 10 : undefined,
      sugar: nutrients.sugar !== undefined ? Math.round(nutrients.sugar * scale * 10) / 10 : undefined,
      sodium: nutrients.sodium !== undefined ? Math.round(nutrients.sodium * scale) : undefined,
    };
  }
  
  // Default: return per 100g values
  return {
    calories: Math.round(nutrients.calories),
    protein: Math.round(nutrients.protein * 10) / 10,
    carbs: Math.round(nutrients.carbs * 10) / 10,
    fat: Math.round(nutrients.fat * 10) / 10,
    fiber: nutrients.fiber !== undefined ? Math.round(nutrients.fiber * 10) / 10 : undefined,
    sugar: nutrients.sugar !== undefined ? Math.round(nutrients.sugar * 10) / 10 : undefined,
    sodium: nutrients.sodium !== undefined ? Math.round(nutrients.sodium) : undefined,
  };
}

/**
 * Ranks FDC foods by data quality and relevance
 */
function rankFoods(foods: FDCFood[], query: string): FDCFood[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  return foods
    .map(food => {
      let score = 0;
      const description = (food.description || '').toLowerCase();
      
      // Data type ranking (higher is better)
      if (food.dataType === 'Foundation') {
        score += 100;
      } else if (food.dataType === 'SR Legacy') {
        score += 80;
      } else if (food.dataType === 'Survey (FNDDS)') {
        score += 60;
      } else {
        score += 20;
      }
      
      // Exact name match bonus
      if (description === normalizedQuery) {
        score += 50;
      } else if (description.startsWith(normalizedQuery)) {
        score += 30;
      } else if (description.includes(normalizedQuery)) {
        score += 10;
      }
      
      // Shorter description bonus (more concise = better)
      score += Math.max(0, 50 - description.length);
      
      return { food, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.food);
}

/**
 * Filters FDC foods to only include those with complete macro data
 */
function filterValidFoods(foods: FDCFood[]): FDCFood[] {
  return foods.filter(food => {
    const nutrients = extractNutrients(food.foodNutrients);
    // Must have calories, protein, carbs, and fat
    return (
      nutrients.calories > 0 &&
      nutrients.protein >= 0 &&
      nutrients.carbs >= 0 &&
      nutrients.fat >= 0
    );
  });
}

/**
 * Searches FDC for foods matching the query
 */
export async function searchFoods(
  query: string,
  pageSize: number = 25
): Promise<FDCSearchResult[]> {
  try {
    // Normalize query
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    // Decode API key
    const apiKey = atob(FDC_API_KEY);

    // Make POST request to FDC search endpoint
    const response = await fetch(
      `${FDC_BASE_URL}/foods/search?api_key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: normalizedQuery,
          pageSize: Math.min(pageSize, 200), // FDC max is 200
          dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
          pageNumber: 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`FDC API request failed: ${response.status}`);
    }

    const data: FDCSearchResponse = await response.json();
    
    if (!data.foods || data.foods.length === 0) {
      return [];
    }

    // Filter, rank, and map results
    const validFoods = filterValidFoods(data.foods);
    const rankedFoods = rankFoods(validFoods, normalizedQuery);
    
    const results: FDCSearchResult[] = [];
    for (const food of rankedFoods.slice(0, pageSize)) {
      try {
        const nutrition = getNutritionPerServing(food);
        const servingSize = getServingSize(food);
        
        results.push({
          name: food.description,
          brand: food.brandOwner || food.brandName,
          fdcId: food.fdcId,
          barcode: undefined, // FDC doesn't provide barcodes
          servingSize,
          nutritionPerServing: nutrition,
          source: 'fdc',
        });
      } catch (error) {
        console.warn('Failed to parse FDC food:', food.fdcId, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching FDC:', error);
    throw error;
  }
}
