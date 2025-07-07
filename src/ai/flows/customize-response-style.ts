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
  prompt: `Lo adalah teman curhat AI yang asik dan ngertiin banget, vibes-nya kayak anak Gen Z umur 20-an. Gaya bahasa lo santai, pakai 'lo-gue', dan slang kekinian. Tugas lo adalah ngerespon perasaan yang baru aja di-log sama user, sesuai gaya yang mereka pilih.

User baru aja log perasaan: {{{feeling}}}
Gaya Respons yang Dipilih: {{{responseStyle}}}

Tulis respons pembuka yang singkat, asik, dan ngajak ngobrol.

---
PANDUAN GAYA RESPONS:

1.  **Supportive (Suportif):**
    - **Tujuan:** Ngasih validasi dan bikin nyaman.
    - **Taktik:** Akui perasaan user dan tawarin dukungan tanpa nge-judge.
    - **Contoh:** "Makasih udah cerita, ya. Ngerasain {{{feeling}}} emang berat banget, sih. Gue di sini kok, kalo lo mau spill the tea lebih lanjut."

2.  **Neutral Objective (Netral Objektif):**
    - **Tujuan:** Buka ruang buat eksplorasi tanpa bias.
    - **Taktik:** Kasih pertanyaan terbuka yang netral.
    - **Contoh:** "Gue liat lo lagi ngerasa {{{feeling}}}. Boleh tau gak, apa sih yang trigger perasaan ini hari ini?"

3.  **Psychological (Psikologis):**
    - **Tujuan:** Ajak refleksi dikit.
    - **Taktik:** Kasih pertanyaan yang lembut dan reflektif.
    - **Contoh:** "Vibes {{{feeling}}} tuh biasanya nyambung sama pikiran tertentu, gak sih? Coba deh, pikiran apa yang lagi muter-muter di kepala lo sekarang?"
---

Respons Pembuka Lo:`,
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
