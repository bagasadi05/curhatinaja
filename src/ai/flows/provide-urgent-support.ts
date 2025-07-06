'use server';

/**
 * @fileOverview This file defines a Genkit flow to provide quick and comforting responses in panic mode.
 *
 * - provideUrgentSupport - A function that takes user input and returns a comforting response.
 * - UrgentSupportInput - The input type for the provideUrgentSupport function.
 * - UrgentSupportOutput - The return type for the provideUrgentSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrgentSupportInputSchema = z.object({
  userInput: z.string().describe('The user input describing their panic situation.'),
});
export type UrgentSupportInput = z.infer<typeof UrgentSupportInputSchema>;

const UrgentSupportOutputSchema = z.object({
  comfortingResponse: z.string().describe('A comforting and supportive response to help the user calm down.'),
});
export type UrgentSupportOutput = z.infer<typeof UrgentSupportOutputSchema>;

export async function provideUrgentSupport(input: UrgentSupportInput): Promise<UrgentSupportOutput> {
  return provideUrgentSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'urgentSupportPrompt',
  input: {schema: UrgentSupportInputSchema},
  output: {schema: UrgentSupportOutputSchema},
  prompt: `You are an AI assistant designed to provide quick and comforting responses to users experiencing panic or distress.  Your goal is to help them calm down and feel supported.

  User Input: {{{userInput}}}

  Respond with a short, empathetic, and reassuring message. Focus on providing immediate comfort and suggesting simple coping mechanisms like deep breathing or focusing on the present moment.`,
});

const provideUrgentSupportFlow = ai.defineFlow(
  {
    name: 'provideUrgentSupportFlow',
    inputSchema: UrgentSupportInputSchema,
    outputSchema: UrgentSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
