interface NutritionAnalysisRequest {
  description?: string;
  imageBase64?: string;
  apiKey: string;
}

interface NutritionAnalysisResponse {
  name: string;
  brand?: string;
  servingSize: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  confidence: number;
  reasoning?: string;
}

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

Only respond with valid JSON. No additional text.
`;


export async function analyzeFood(request: NutritionAnalysisRequest): Promise<NutritionAnalysisResponse> {
  if (!request.apiKey) {
    throw new Error('ChatGPT API key is required');
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from ChatGPT');
  }

  try {
    const parsed = JSON.parse(content);

    // Validate the response structure
    if (!parsed.name || !parsed.nutrition) {
      throw new Error('Invalid response format from ChatGPT');
    }

    return parsed as NutritionAnalysisResponse;
  } catch (parseError) {
    console.error('Failed to parse ChatGPT response:', content);
    throw new Error('Invalid JSON response from ChatGPT');
  }
}