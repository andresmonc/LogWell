/**
 * AI Food Analysis Service
 * 
 * Uses OpenRouter API to access multiple AI models (GPT-4, Claude, Gemini, etc.)
 * for nutrition analysis from food descriptions and images.
 * 
 * Note: File named 'openai.ts' for historical reasons, but uses OpenRouter API.
 */

import type { NutritionAnalysisRequest, NutritionAnalysisResponse } from '../types/api';
import { AI_CONFIG } from '../utils/constants';

const NUTRITION_ANALYSIS_PROMPT = `
You are a nutrition expert. Analyze the provided food description or image and provide nutrition information in JSON format.

Instructions:
- First determine whether the description refers to a full meal, a mixed homemade dish, a branded food item, or a single ingredient.
- If it's a mixed meal or homemade item (e.g., "1 cup yogurt, 1 tbsp honey, handful granola"), estimate **total nutrition for the entire portion described**, not per 100g.
- If it’s a branded food or clearly packaged item (e.g., "Whopper from McDonald's", "1 slice of frozen lasagna"), give nutrition **per standard serving** if possible.
- If a food item has a common standard serving (e.g., 2 tbsp peanut butter, 1 tbsp honey), use that as the serving size. If it's a branded or prepared item, use its typical serving. For generic, unquantified ingredients, default to 100g. For meal descriptions, estimate total nutrition for the full portion
- Always include a confidence score from 0 to 1 and explain your assumptions in the reasoning.

Return only a valid JSON object in this exact format:

{
  "name": "Food Name",
  "brand": "Brand Name (only if clearly identifiable)",
  "servingSize": "1 slice", 
  "nutrition": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "sodium": 0
  },
  "confidence": 0.85,
  "reasoning": "Brief explanation of serving size choice and nutritional estimates"
}

IMPORTANT: Return only valid JSON. Use plain numbers without underscores (e.g., use 1360 not 1_360). No markdown code blocks, no additional text, no trailing commas.
`;


export async function analyzeFood(request: NutritionAnalysisRequest): Promise<NutritionAnalysisResponse> {
  if (!request.apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  if (!request.description && !request.imageBase64) {
    throw new Error('Either description or image is required');
  }

  const messages: any[] = [
    {
      role: 'system',
      content: NUTRITION_ANALYSIS_PROMPT
    }
  ];

  if (request.description) {
    messages.push({
      role: 'user',
      content: `Analyze this food: ${request.description}`
    });
  }

  if (request.imageBase64) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: request.description
            ? `Analyze this food image. Additional context: ${request.description}`
            : 'Analyze this food image and provide nutrition information.'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${request.imageBase64}`,
            detail: 'low'
          }
        }
      ]
    });
  }

  const response = await fetch(AI_CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.apiKey}`,
      'HTTP-Referer': AI_CONFIG.SITE_URL,
      'X-Title': AI_CONFIG.SITE_NAME
    },
    body: JSON.stringify({
      model: request.model || AI_CONFIG.DEFAULT_MODEL,
      messages,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      temperature: AI_CONFIG.TEMPERATURE
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API request failed: ${response.status}`;
    const error = new Error(errorMessage);
    
    // Attach additional error info for better error handling
    (error as any).statusCode = response.status;
    (error as any).errorType = errorData.error?.type;
    (error as any).errorCode = errorData.error?.code;
    
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    // Clean and parse the JSON response
    const parsed = parseAIResponse(content);

    // Validate the response structure
    if (!parsed.name || !parsed.nutrition) {
      const error = new Error('Invalid response format from AI');
      (error as any).rawResponse = content;
      throw error;
    }

    return parsed as NutritionAnalysisResponse;
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    const error = new Error('Invalid JSON response from AI');
    (error as any).rawResponse = content;
    throw error;
  }
}

/**
 * Parse AI response with resilience to common formatting issues
 */
function parseAIResponse(content: string): any {
  let cleaned = content.trim();

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Remove any leading/trailing text that might wrap the JSON
  // Try to find JSON object boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  // Fix common JSON issues:
  // 1. Remove underscores from numbers (e.g., 1_360 -> 1360)
  // This handles underscores in numeric values throughout the JSON
  cleaned = cleaned.replace(/(\d+)_(\d+)/g, '$1$2');
  
  // 2. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // Try to parse the cleaned JSON
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // If that fails, try a more aggressive cleanup
    // Extract just the JSON object if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let jsonContent = jsonMatch[0];
        // Ensure all number underscores are removed (fallback)
        jsonContent = jsonContent.replace(/(\d+)_(\d+)/g, '$1$2');
        // Remove trailing commas again
        jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(jsonContent);
      } catch (secondError) {
        // If still failing, throw the original error with context
        throw firstError;
      }
    }
    throw firstError;
  }
}