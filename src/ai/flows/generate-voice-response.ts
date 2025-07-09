'use server';

/**
 * @fileOverview Menghasilkan respons suara yang cepat untuk mode telepon.
 *
 * - generateVoiceResponse - Fungsi yang menghasilkan respons teks singkat untuk diubah menjadi suara.
 * - GenerateVoiceResponseInput - Tipe input untuk fungsi generateVoiceResponse.
 * - GenerateVoiceResponseOutput - Tipe kembalian untuk fungsi generateVoiceResponse.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVoiceResponseInputSchema = z.object({
  textInput: z.string().optional().describe('Input teks pengguna dari ucapan.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().describe('Riwayat percakapan untuk konteks.'),
  prompt: z.string().optional().describe('Prompt kustom untuk menginstruksikan AI.'),
});
export type GenerateVoiceResponseInput = z.infer<typeof GenerateVoiceResponseInputSchema>;

const GenerateVoiceResponseOutputSchema = z.object({
  responseText: z.string().describe('Respons AI yang singkat dan empatik.'),
});
export type GenerateVoiceResponseOutput = z.infer<typeof GenerateVoiceResponseOutputSchema>;

export async function generateVoiceResponse(input: GenerateVoiceResponseInput): Promise<GenerateVoiceResponseOutput> {
  return generateVoiceResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVoiceResponsePrompt',
  input: {schema: GenerateVoiceResponseInputSchema},
  output: {schema: GenerateVoiceResponseOutputSchema},
  prompt: `Lo adalah teman ngobrol AI yang asik di telepon. Respons pake bahasa gaul Indonesia yang santai dan natural.
Kasih respons yang singkat, suportif, dan validasi perasaan mereka. Kalo perlu, lempar pertanyaan simpel.
Jangan kepanjangan, keep it short and sweet.

User bilang: {{{textInput}}}

Respons singkat lo:`,
});

const generateVoiceResponseFlow = ai.defineFlow(
  {
    name: 'generateVoiceResponseFlow',
    inputSchema: GenerateVoiceResponseInputSchema,
    outputSchema: GenerateVoiceResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
