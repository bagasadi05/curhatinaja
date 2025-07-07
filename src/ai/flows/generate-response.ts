'use server';

/**
 * @fileOverview Menghasilkan respons terhadap input teks pengguna dalam mode obrolan.
 *
 * - generateResponse - Fungsi yang menghasilkan respons berdasarkan input pengguna dan gaya respons yang dipilih.
 * - GenerateResponseInput - Tipe input untuk fungsi generateResponse.
 * - GenerateResponseOutput - Tipe kembalian untuk fungsi generateResponse.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResponseInputSchema = z.object({
  textInput: z.string().describe('Input teks pengguna dalam obrolan.'),
  responseStyle: z
    .enum(['Supportive', 'Neutral Objective', 'Psychological'])
    .describe('Gaya respons yang diinginkan dari AI.'),
});
export type GenerateResponseInput = z.infer<typeof GenerateResponseInputSchema>;

const GenerateResponseOutputSchema = z.object({
  responseText: z.string().describe('Respons yang dihasilkan AI.'),
});
export type GenerateResponseOutput = z.infer<typeof GenerateResponseOutputSchema>;

export async function generateResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  return generateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResponsePrompt',
  input: {schema: GenerateResponseInputSchema},
  output: {schema: GenerateResponseOutputSchema},
  prompt: `Anda adalah asisten AI yang dirancang untuk memberikan dukungan dan bimbingan kepada pengguna dalam mode obrolan dalam Bahasa Indonesia.
Tujuan Anda adalah menghasilkan respons yang empatik, membantu, dan disesuaikan dengan kebutuhan pengguna serta gaya respons yang dipilih.

Input Pengguna: {{{textInput}}}

Gaya Respons: {{{responseStyle}}}

Berdasarkan input pengguna dan gaya respons yang dipilih, hasilkan respons yang menunjukkan empati dan pengertian.
Gunakan teknik pembingkaian ulang kognitif jika sesuai untuk membantu pengguna melihat situasi mereka dari perspektif yang berbeda.

Respons:`,
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
