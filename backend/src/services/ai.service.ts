import OpenAI from 'openai';
import { AIGeneratedPaperSchema, AIGeneratedPaper } from '../lib/validators';
import { logger } from '../utils/logger';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function generatePaperWithAI(prompt: string): Promise<AIGeneratedPaper> {
  logger.info('Calling Groq API for paper generation');

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq API');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse Groq response as JSON: ${raw.slice(0, 200)}`);
  }

  const result = AIGeneratedPaperSchema.safeParse(parsed);
  if (!result.success) {
    logger.error('Zod validation failed for AI response', { errors: result.error.flatten() });
    throw new Error(`AI response failed validation: ${JSON.stringify(result.error.flatten())}`);
  }

  return result.data;
}
