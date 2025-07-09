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
  prompt: `
    Kamu adalah Teman Curhat AI, sahabat yang mendengarkan dengan empati.
    Jawab singkat, gunakan bahasa Indonesia santai, dan validasi perasaan lawan bicara.
    Jangan terlalu panjang, cukup 1-2 kalimat saja.
    Jangan mengulang respons sebelumnya. Jawab hanya untuk ucapan terakhir user.
    Berikut percakapan singkat terakhir. Berikan respons yang hangat dan natural untuk ucapan terakhir dari pengguna.
  `,
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
