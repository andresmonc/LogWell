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
 * Brand alias dictionary for common misspellings and variations
 * Maps common user inputs to the canonical brand name used in databases
 */
const BRAND_ALIASES: Record<string, string> = {
  // Fast food restaurants
  'chik fil a': 'chick-fil-a',
  'chikfila': 'chick-fil-a',
  'chik-fil-a': 'chick-fil-a',
  'chickfila': 'chick-fil-a',
  'chic fil a': 'chick-fil-a',
  'chicfila': 'chick-fil-a',
  'cfa': 'chick-fil-a',
  'mcdonalds': "mcdonald's",
  'mcdonald': "mcdonald's",
  'mcd': "mcdonald's",
  'mickey d': "mcdonald's",
  'mickey ds': "mcdonald's",
  'wendys': "wendy's",
  'wendy': "wendy's",
  'popeys': "popeyes",
  'popeye': "popeyes",
  'arbys': "arby's",
  'arby': "arby's",
  'dennys': "denny's",
  'denny': "denny's",
  'hardees': "hardee's",
  'hardee': "hardee's",
  'carls jr': "carl's jr",
  'carls junior': "carl's jr",
  'carl jr': "carl's jr",
  'in n out': 'in-n-out',
  'innout': 'in-n-out',
  'in and out': 'in-n-out',
  'five guys': 'five guys',
  '5 guys': 'five guys',
  'chipotle': 'chipotle',
  'chipotles': 'chipotle',
  'taco bell': 'taco bell',
  'tacobell': 'taco bell',
  'burger king': 'burger king',
  'bk': 'burger king',
  'kfc': 'kfc',
  'kentucky fried': 'kfc',
  'subway': 'subway',
  'subways': 'subway',
  'starbucks': 'starbucks',
  'sbux': 'starbucks',
  'dunkin': "dunkin'",
  'dunkin donuts': "dunkin'",
  'dunkin doughnuts': "dunkin'",
  'panera': 'panera bread',
  'panda express': 'panda express',
  'panda': 'panda express',
  'dominos': "domino's",
  'domino': "domino's",
  'papa johns': "papa john's",
  'papa john': "papa john's",
  'pizza hut': 'pizza hut',
  'pizzahut': 'pizza hut',
  'little caesars': "little caesars",
  'little ceasars': "little caesars",
  'sonic': 'sonic drive-in',
  'jack in the box': 'jack in the box',
  'jack box': 'jack in the box',
  'jitb': 'jack in the box',
  'whataburger': 'whataburger',
  'what a burger': 'whataburger',
  'shake shack': 'shake shack',
  'shakeshack': 'shake shack',
  'wingstop': 'wingstop',
  'wing stop': 'wingstop',
  'buffalo wild wings': 'buffalo wild wings',
  'bww': 'buffalo wild wings',
  'bdubs': 'buffalo wild wings',
  'chilis': "chili's",
  'chili': "chili's",
  'applebees': "applebee's",
  'applebee': "applebee's",
  'outback': 'outback steakhouse',
  'olive garden': 'olive garden',
  'red lobster': 'red lobster',
  'ihop': 'ihop',
  'cracker barrel': 'cracker barrel',
  'waffle house': 'waffle house',
  // Grocery brands
  'trader joes': "trader joe's",
  'trader joe': "trader joe's",
  'tj': "trader joe's",
  'whole foods': 'whole foods',
  '365': 'whole foods 365',
  'kirkland': 'kirkland signature',
  'great value': 'great value',
  'market pantry': 'market pantry',
  'good gather': 'good & gather',
  'good and gather': 'good & gather',
  'simply balanced': 'simply balanced',
};

/**
 * Known brand names - used to detect if query contains a brand
 * for prioritizing Branded data type in results
 */
const KNOWN_BRANDS = new Set([
  'chick-fil-a', "mcdonald's", "wendy's", 'popeyes', "arby's", "denny's",
  "hardee's", "carl's jr", 'in-n-out', 'five guys', 'chipotle', 'taco bell',
  'burger king', 'kfc', 'subway', 'starbucks', "dunkin'", 'panera bread',
  'panda express', "domino's", "papa john's", 'pizza hut', 'little caesars',
  'sonic drive-in', 'jack in the box', 'whataburger', 'shake shack', 'wingstop',
  'buffalo wild wings', "chili's", "applebee's", 'outback steakhouse',
  'olive garden', 'red lobster', 'ihop', 'cracker barrel', 'waffle house',
  "trader joe's", 'whole foods', 'kirkland signature', 'great value',
  'market pantry', 'good & gather', 'simply balanced',
]);

/**
 * Applies brand aliases to normalize common misspellings
 * Exported for use by other search services (e.g., OpenFoodFacts)
 */
export function applyBrandAliases(query: string): string {
  let result = query.toLowerCase();
  
  // Check each alias (longer aliases first to avoid partial matches)
  const sortedAliases = Object.keys(BRAND_ALIASES).sort((a, b) => b.length - a.length);
  
  for (const alias of sortedAliases) {
    if (result.includes(alias)) {
      result = result.replace(alias, BRAND_ALIASES[alias]);
      break; // Only replace one brand per query
    }
  }
  
  return result;
}

/**
 * Checks if query contains a known brand name
 */
function containsBrand(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lowerQuery.includes(brand)) {
      return true;
    }
  }
  return false;
}

/**
 * Normalizes search query according to FDC requirements:
 * - Apply brand aliases for common misspellings
 * - lowercase
 * - trim
 * - collapse spaces
 * - remove trailing plural 's'
 * - ignore queries < 3 chars
 */
export function normalizeQuery(query: string): string | null {
  // First apply brand aliases
  let normalized = applyBrandAliases(query.trim());
  
  // Ignore queries < 3 chars
  if (normalized.length < 3) {
    return null;
  }
  
  // Collapse multiple spaces into single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Don't remove trailing 's' from brand names
  if (!containsBrand(normalized)) {
    // Remove trailing plural 's' (simple heuristic)
    // Only if word is > 3 chars to avoid removing 's' from words like 'rice'
    if (normalized.length > 3 && normalized.endsWith('s')) {
      const withoutS = normalized.slice(0, -1);
      // Only remove if it doesn't create a word that's too short
      if (withoutS.length >= 3) {
        normalized = withoutS;
      }
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
 * Tokenizes a string into words, filtering out common stop words
 */
function tokenize(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'with', 'in', 'of', 'for', 'to', 'on']);
  return text
    .toLowerCase()
    .split(/[\s,\-\/]+/)
    .filter(word => word.length >= 2 && !stopWords.has(word));
}

/**
 * Calculates word match score between query tokens and description
 * Returns percentage of query words found (0-100)
 */
function calculateWordMatchScore(queryTokens: string[], description: string): number {
  if (queryTokens.length === 0) return 0;
  
  const descLower = description.toLowerCase();
  const descTokens = new Set(tokenize(description));
  
  let matchCount = 0;
  let partialMatchCount = 0;
  
  for (const queryWord of queryTokens) {
    // Exact word match
    if (descTokens.has(queryWord)) {
      matchCount++;
    }
    // Partial match (query word appears within description)
    else if (descLower.includes(queryWord)) {
      partialMatchCount++;
    }
    // Check if any description word starts with query word
    else {
      for (const descWord of descTokens) {
        if (descWord.startsWith(queryWord) || queryWord.startsWith(descWord)) {
          partialMatchCount += 0.5;
          break;
        }
      }
    }
  }
  
  const fullMatches = matchCount * 100 / queryTokens.length;
  const partialMatches = partialMatchCount * 50 / queryTokens.length;
  
  return fullMatches + partialMatches;
}

/**
 * Ranks FDC foods by data quality and relevance
 * 
 * Scoring factors:
 * - Word tokenization: Each query word is scored separately
 * - Brand detection: Boosts Branded items when query contains a brand
 * - Data type quality: Foundation > SR Legacy > Survey > Branded (unless brand query)
 * - Description length: Shorter = better (more specific)
 */
function rankFoods(foods: FDCFood[], query: string): FDCFood[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = tokenize(normalizedQuery);
  const isBrandQuery = containsBrand(normalizedQuery);
  
  return foods
    .map(food => {
      let score = 0;
      const description = (food.description || '').toLowerCase();
      const brand = ((food.brandOwner || '') + ' ' + (food.brandName || '')).toLowerCase();
      
      // Data type ranking - adjusted based on whether this is a brand query
      if (isBrandQuery) {
        // For brand queries, prioritize Branded items
        if (food.dataType === 'Branded') {
          score += 100;
        } else if (food.dataType === 'Foundation') {
          score += 40;
        } else if (food.dataType === 'SR Legacy') {
          score += 30;
        } else {
          score += 20;
        }
      } else {
        // For generic queries, prioritize quality data sources
        if (food.dataType === 'Foundation') {
          score += 100;
        } else if (food.dataType === 'SR Legacy') {
          score += 80;
        } else if (food.dataType === 'Survey (FNDDS)') {
          score += 60;
        } else {
          score += 20;
        }
      }
      
      // Word tokenization scoring (0-100 points)
      const wordMatchScore = calculateWordMatchScore(queryTokens, description);
      score += wordMatchScore;
      
      // Brand match bonus for brand queries
      if (isBrandQuery && brand) {
        const brandMatchScore = calculateWordMatchScore(queryTokens, brand);
        score += brandMatchScore * 0.5; // 50% weight for brand matching
      }
      
      // Exact name match bonus
      if (description === normalizedQuery) {
        score += 50;
      } else if (description.startsWith(normalizedQuery)) {
        score += 30;
      }
      
      // Shorter description bonus (more concise = better)
      // Cap at 30 points to not over-weight short names
      score += Math.max(0, Math.min(30, 50 - description.length));
      
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
