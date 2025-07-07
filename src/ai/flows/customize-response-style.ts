'use server';

/**
 * @fileOverview Agen AI yang menyesuaikan gaya responsnya berdasarkan preferensi pengguna.
 *
 * - customizeAIResponseStyle - Fungsi yang menangani proses kustomisasi respons AI.
 * - CustomizeAIResponseStyleInput - Tipe input untuk fungsi customizeAIResponseStyle.
 * - CustomizeAIResponseStyleOutput - Tipe kembalian untuk fungsi customizeAIResponseStyle.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeAIResponseStyleInputSchema = z.object({
  feeling: z.string().describe('Perasaan pengguna yang perlu diproses.'),
  responseStyle: z
    .enum(['Supportive', 'Neutral Objective', 'Psychological'])
    .describe('Gaya respons yang diinginkan dari AI.'),
});
export type CustomizeAIResponseStyleInput = z.infer<
  typeof CustomizeAIResponseStyleInputSchema
>;

const CustomizeAIResponseStyleOutputSchema = z.object({
  response: z.string().describe('Respons AI yang disesuaikan dengan perasaan pengguna dan gaya respons.'),
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
  prompt: `Anda adalah asisten AI yang dirancang untuk memberikan respons dalam Bahasa Indonesia berdasarkan gaya respons yang dipilih pengguna.

  Pengguna merasa: {{{feeling}}}

  Pengguna telah meminta gaya respons berikut: {{{responseStyle}}}

  Berdasarkan informasi di atas, berikan respons yang disesuaikan dengan perasaan dan gaya respons pengguna.

  Jika gaya responsnya Suportif, berikan empati dan dorongan.
  Jika gaya responsnya Netral Objektif, berikan perspektif yang seimbang dan tidak bias.
  Jika gaya responsnya Psikologis, gunakan teknik pembingkaian ulang kognitif untuk membantu pengguna.
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
