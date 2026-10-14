import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export type DescriptionTone = 'professional' | 'marketing' | 'seo' | 'casual';

export interface GenerateDescriptionInput {
  name: string;
  category?: string;
  price?: number;
  sku?: string;
  attributes?: Array<{ name: string; values: string[] }>;
  productType?: string;
  tone: DescriptionTone;
}

export interface GenerateDescriptionResult {
  success: boolean;
  shortDescription?: string;
  longDescription?: string;
  seoTitle?: string;
  seoKeywords?: string[];
  error?: string;
}

const TONE_INSTRUCTIONS: Record<DescriptionTone, string> = {
  professional: 'Write in a formal, authoritative, business-professional tone. Use precise, factual language that builds trust.',
  marketing: 'Write in an energetic, persuasive, and compelling marketing tone. Use powerful action words, emotional triggers, and emphasize benefits. Make it exciting and conversion-focused.',
  seo: 'Write with SEO optimization in mind. Include the product name and key attributes naturally throughout. Focus on searchable terms, long-tail keywords, and clear benefit statements. Structure for readability.',
  casual: 'Write in a friendly, conversational, approachable tone. Avoid jargon. Speak directly to the customer like a helpful friend who knows the product well.',
};

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured in the environment.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const attributeLines = (input.attributes || [])
      .filter(a => a.values && a.values.length > 0)
      .map(a => `- ${a.name}: ${a.values.join(', ')}`)
      .join('\n');

    const prompt = `You are an expert eCommerce product copywriter specializing in WooCommerce product listings.

Generate a complete product description for the following product:

Product Name: ${input.name}
Category: ${input.category || 'General'}
Price: ${input.price ? `$${input.price.toFixed(2)}` : 'Not specified'}
SKU: ${input.sku || 'Not specified'}
Product Type: ${input.productType || 'simple'}
${attributeLines ? `Attributes:\n${attributeLines}` : ''}

Tone instruction: ${TONE_INSTRUCTIONS[input.tone]}

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences, just raw JSON):
{
  "shortDescription": "1-2 sentence compelling summary (max 150 chars)",
  "longDescription": "Full product description with 2-3 paragraphs. Rich, detailed, well-structured.",
  "seoTitle": "SEO-optimized page title (max 60 chars)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'];
    let text = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        text = result.response.text().trim();
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Model ${modelName} failed, trying fallback:`, err.message);
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    // Robust JSON extraction
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonStr = (firstBrace !== -1 && lastBrace !== -1)
      ? text.substring(firstBrace, lastBrace + 1)
      : text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      shortDescription: parsed.shortDescription || '',
      longDescription: parsed.longDescription || '',
      seoTitle: parsed.seoTitle || '',
      seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
    };
  } catch (err: any) {
    console.error('[Gemini] Error generating product description:', err.message);
    return {
      success: false,
      error: err.message || 'Gemini API call failed',
    };
  }
}

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 10);
}
