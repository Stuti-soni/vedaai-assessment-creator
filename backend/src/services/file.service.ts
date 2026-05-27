import OpenAI from 'openai';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }> };
};

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text.trim();
  }

  if (mimetype.startsWith('image/')) {
    return describeImageWithVision(buffer, mimetype);
  }

  return '';
}

async function describeImageWithVision(buffer: Buffer, mimetype: string): Promise<string> {
  logger.info('Using Groq vision model to describe uploaded image');

  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimetype};base64,${base64}`;

  const response = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
          {
            type: 'text',
            text: 'Describe this educational image in detail. List all key concepts, labels, terms, processes, and facts shown. Be thorough — this description will be used to generate exam questions.',
          },
        ],
      },
    ],
    max_tokens: 1024,
  });

  const description = response.choices[0]?.message?.content ?? '';
  logger.info('Image description obtained from vision model');
  return description;
}
