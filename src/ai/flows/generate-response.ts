'use server';

/**
 * @fileOverview Generates a response to the user's text input in a chat mode.
 *
 * - generateResponse - A function that generates a response based on the user's input and selected response style.
 * - GenerateResponseInput - The input type for the generateResponse function.
 * - GenerateResponseOutput - The return type for the generateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResponseInputSchema = z.object({
  textInput: z.string().describe('The user\u0027s text input in the chat.'),
  responseStyle: z
    .enum(['Supportive', 'Neutral Objective', 'Psychological'])
    .describe('The desired response style from the AI.'),
});
export type GenerateResponseInput = z.infer<typeof GenerateResponseInputSchema>;

const GenerateResponseOutputSchema = z.object({
  responseText: z.string().describe('The AI generated response.'),
});
export type GenerateResponseOutput = z.infer<typeof GenerateResponseOutputSchema>;

export async function generateResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  return generateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResponsePrompt',
  input: {schema: GenerateResponseInputSchema},
  output: {schema: GenerateResponseOutputSchema},
  prompt: `You are an AI assistant designed to provide support and guidance to users in a chat mode.
Your goal is to generate responses that are empathetic, helpful, and tailored to the user\u0027s needs and the selected response style.

User Input: {{{textInput}}}

Response Style: {{{responseStyle}}}

Based on the user input and the selected response style, generate a response that demonstrates empathy and understanding.
Incorporate cognitive reframing techniques where appropriate to help the user see their situation from a different perspective.

Response:`,
});

const generateResponseFlow = ai.defineFlow(
  {
    name: 'generateResponseFlow',
    inputSchema: GenerateResponseInputSchema,
    outputSchema: GenerateResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
