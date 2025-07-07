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
  textInput: z.string().describe('Input teks pengguna dari ucapan.'),
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
  prompt: `Anda adalah teman AI yang empatik dan pendengar yang baik dalam sebuah panggilan suara. Tanggapi pengguna dalam Bahasa Indonesia.
Berikan respons yang singkat, suportif, dan terdengar alami untuk percakapan suara.
Fokus pada validasi perasaan mereka dan ajukan pertanyaan terbuka jika perlu. Hindari respons yang panjang dan kompleks.

Pengguna berkata: {{{textInput}}}

Respons singkat Anda:`,
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
