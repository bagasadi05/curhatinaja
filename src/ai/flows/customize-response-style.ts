'use server';

/**
 * @fileOverview An AI agent that customizes its response style based on user preference.
 *
 * - customizeAIResponseStyle - A function that handles the AI response customization process.
 * - CustomizeAIResponseStyleInput - The input type for the customizeAIResponseStyle function.
 * - CustomizeAIResponseStyleOutput - The return type for the customizeAIResponseStyle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeAIResponseStyleInputSchema = z.object({
  feeling: z.string().describe('The user feeling that needs to be processed.'),
  responseStyle: z
    .enum(['Supportive', 'Neutral Objective', 'Psychological'])
    .describe('The desired response style from the AI.'),
});
export type CustomizeAIResponseStyleInput = z.infer<
  typeof CustomizeAIResponseStyleInputSchema
>;

const CustomizeAIResponseStyleOutputSchema = z.object({
  response: z.string().describe('The AI response tailored to the user feeling and response style.'),
});
export type CustomizeAIResponseStyleOutput = z.infer<
  typeof CustomizeAIResponseStyleOutputSchema
>;

export async function customizeAIResponseStyle(
  input: CustomizeAIResponseStyleInput
): Promise<CustomizeAIResponseStyleOutput> {
  return customizeAIResponseStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeAIResponseStylePrompt',
  input: {schema: CustomizeAIResponseStyleInputSchema},
  output: {schema: CustomizeAIResponseStyleOutputSchema},
  prompt: `You are an AI assistant designed to provide responses based on the user's selected response style.

  The user is feeling: {{{feeling}}}

  The user has requested the following response style: {{{responseStyle}}}

  Based on the above information, provide a response that is tailored to the user's feeling and response style.

  If the response style is Supportive, be empathetic and encouraging.
  If the response style is Neutral Objective, provide a balanced and unbiased perspective.
  If the response style is Psychological, use cognitive reframing techniques to help the user.
  `,
});

const customizeAIResponseStyleFlow = ai.defineFlow(
  {
    name: 'customizeAIResponseStyleFlow',
    inputSchema: CustomizeAIResponseStyleInputSchema,
    outputSchema: CustomizeAIResponseStyleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
