'use server';

/**
 * @fileOverview File ini mendefinisikan alur Genkit untuk memberikan respons cepat dan menenangkan dalam mode panik.
 *
 * - provideUrgentSupport - Sebuah fungsi yang menerima input pengguna dan mengembalikan respons yang menenangkan.
 * - UrgentSupportInput - Tipe input untuk fungsi provideUrgentSupport.
 * - UrgentSupportOutput - Tipe kembalian untuk fungsi provideUrgentSupport.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrgentSupportInputSchema = z.object({
  userInput: z.string().describe('Input pengguna yang menjelaskan situasi paniknya.'),
});
export type UrgentSupportInput = z.infer<typeof UrgentSupportInputSchema>;

const UrgentSupportOutputSchema = z.object({
  comfortingResponse: z.string().describe('Respons yang menenangkan dan suportif untuk membantu pengguna tenang.'),
});
export type UrgentSupportOutput = z.infer<typeof UrgentSupportOutputSchema>;

export async function provideUrgentSupport(input: UrgentSupportInput): Promise<UrgentSupportOutput> {
  return provideUrgentSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'urgentSupportPrompt',
  input: {schema: UrgentSupportInputSchema},
  output: {schema: UrgentSupportOutputSchema},
  prompt: `Anda adalah asisten AI yang dirancang untuk memberikan respons cepat dan menenangkan dalam Bahasa Indonesia kepada pengguna yang mengalami kepanikan atau tekanan. Tujuan Anda adalah membantu mereka tenang dan merasa didukung.

  Input Pengguna: {{{userInput}}}

  Balas dengan pesan singkat, empatik, dan meyakinkan. Fokus pada memberikan kenyamanan segera dan menyarankan mekanisme koping sederhana seperti pernapasan dalam atau fokus pada saat ini.`,
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
