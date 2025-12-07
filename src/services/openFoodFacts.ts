/**
 * Open Food Facts API Service
 * Fetches product information by barcode
 * API Documentation: https://world.openfoodfacts.org/data
 */

export interface OpenFoodFactsProduct {
  code: string;
  status: number;
  status_verbose: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    nutriments?: {
      'energy-kcal'?: number;
      'energy-kcal_100g'?: number;
      'energy-kcal_serving'?: number;
      proteins?: number;
      'proteins_100g'?: number;
      'proteins_serving'?: number;
      carbohydrates?: number;
      'carbohydrates_100g'?: number;
      'carbohydrates_serving'?: number;
      fat?: number;
      'fat_100g'?: number;
      'fat_serving'?: number;
      fiber?: number;
      'fiber_100g'?: number;
      sugars?: number;
      'sugars_100g'?: number;
      sodium?: number;
      'sodium_100g'?: number;
    };
    serving_quantity?: number;
    serving_quantity_unit?: string;
    serving_size?: string;
    product_quantity?: number;
    product_quantity_unit?: string;
    quantity?: string;
    selected_images?: {
      front?: {
        display?: {
          en?: string;
        };
        small?: {
          en?: string;
        };
      };
    };
  };
}

export interface ParsedProduct {
  name: string;
  brand?: string;
  barcode: string;
  imageUrl?: string;
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
}

/**
 * Fetches product information from Open Food Facts API
 */
export async function fetchProductByBarcode(barcode: string): Promise<ParsedProduct | null> {
  try {
    // Clean barcode (remove leading zeros if needed, but keep original format)
    const cleanBarcode = barcode.trim();
    
    if (!cleanBarcode || cleanBarcode.length < 8) {
      throw new Error('Invalid barcode');
    }

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: OpenFoodFactsProduct = await response.json();

    if (data.status === 0 || !data.product) {
      return null; // Product not found
    }

    return parseProductData(data);
  } catch (error) {
    console.error('Error fetching product from Open Food Facts:', error);
    throw error;
  }
}

/**
 * Parses Open Food Facts API response into our app's format
 */
function parseProductData(data: OpenFoodFactsProduct): ParsedProduct {
  const product = data.product!;
  const nutriments = product.nutriments || {};

  // Get product name (prefer English, fallback to default)
  const name = product.product_name_en || product.product_name || 'Unknown Product';

  // Get brand
  const brand = product.brands?.split(',')[0]?.trim() || undefined;

  // Get image URL
  const imageUrl = product.selected_images?.front?.display?.en || 
                   product.selected_images?.front?.small?.en || 
                   undefined;

  // Determine serving size
  let servingSize = '1 serving';
  if (product.serving_size) {
    servingSize = product.serving_size;
  } else if (product.serving_quantity && product.serving_quantity_unit) {
    servingSize = `${product.serving_quantity} ${product.serving_quantity_unit}`;
  } else if (product.quantity) {
    servingSize = product.quantity;
  }

  // Extract nutrition values (prefer per serving, fallback to per 100g)
  const getNutrient = (
    servingKey: string,
    per100gKey: string,
    defaultValue: number = 0
  ): number => {
    const servingValue = nutriments[servingKey as keyof typeof nutriments];
    const per100gValue = nutriments[per100gKey as keyof typeof nutriments];
    
    if (servingValue !== undefined && servingValue !== null) {
      return typeof servingValue === 'number' ? servingValue : defaultValue;
    }
    if (per100gValue !== undefined && per100gValue !== null) {
      return typeof per100gValue === 'number' ? per100gValue : defaultValue;
    }
    return defaultValue;
  };

  // Calories (energy-kcal)
  const calories = getNutrient('energy-kcal_serving', 'energy-kcal_100g', 0);

  // Protein (grams)
  const protein = getNutrient('proteins_serving', 'proteins_100g', 0);

  // Carbs (grams)
  const carbs = getNutrient('carbohydrates_serving', 'carbohydrates_100g', 0);

  // Fat (grams)
  const fat = getNutrient('fat_serving', 'fat_100g', 0);

  // Optional nutrients
  const fiber = getNutrient('fiber_serving', 'fiber_100g', undefined);
  const sugar = getNutrient('sugars_serving', 'sugars_100g', undefined);
  const sodium = getNutrient('sodium_serving', 'sodium_100g', undefined);

  return {
    name,
    brand,
    barcode: data.code,
    imageUrl,
    servingSize,
    nutritionPerServing: {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10, // Round to 1 decimal
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      ...(fiber !== undefined && { fiber: Math.round(fiber * 10) / 10 }),
      ...(sugar !== undefined && { sugar: Math.round(sugar * 10) / 10 }),
      ...(sodium !== undefined && { sodium: Math.round(sodium) }),
    },
  };
}

