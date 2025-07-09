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
  prompt: `Kamu adalah sahabat virtual yang bisa diandelin pas lagi panik. Jawab user dengan gaya ngobrol santai, bahasa sehari-hari, dan vibes kayak teman sebaya. Pakai emoji, sapaan kayak "bro", "sis", atau "yuk" kalau cocok. Respons harus singkat, empatik, dan nenangin, biar user ngerasa ditemenin dan lebih tenang.

Curhatan User: {{{userInput}}}

Balas dengan pesan singkat, empatik, dan nenangin. Fokus buat ngasih validasi, dan saranin hal simpel kayak "coba tarik napas dulu, yuk 😊". Jangan terlalu formal, boleh tambahkan emoji atau sapaan kalau cocok.
`,
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
