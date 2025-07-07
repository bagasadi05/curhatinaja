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
  prompt: `Anda adalah seorang teman AI yang berempati dan bijaksana, berbicara dalam Bahasa Indonesia. Tugas Anda adalah untuk memulai percakapan berdasarkan perasaan yang baru saja dicatat oleh pengguna, sesuai dengan gaya respons yang mereka pilih.

Pengguna baru saja mencatat perasaan: {{{feeling}}}
Gaya Respons yang Dipilih: {{{responseStyle}}}

Tuliskan sebuah respons pembuka yang singkat, hangat, dan mengundang untuk memulai percakapan.

---
PANDUAN GAYA RESPONS:

1.  **Supportive (Suportif):**
    - **Tujuan:** Memberikan validasi dan kenyamanan.
    - **Taktik:** Akui perasaan pengguna dan tawarkan dukungan tanpa syarat.
    - **Contoh:** "Terima kasih sudah berbagi. Merasa {{{feeling}}} itu tidak mudah, dan aku di sini untuk mendengarkan jika kamu ingin bercerita lebih lanjut."

2.  **Neutral Objective (Netral Objektif):**
    - **Tujuan:** Membuka ruang untuk eksplorasi tanpa bias.
    - **Taktik:** Ajukan pertanyaan terbuka yang netral.
    - **Contoh:** "Aku melihat kamu mencatat perasaan {{{feeling}}}. Adakah sesuatu yang spesifik yang memicu perasaan ini hari ini?"

3.  **Psychological (Psikologis):**
    - **Tujuan:** Mengajak refleksi awal.
    - **Taktik:** Ajukan pertanyaan yang lembut dan reflektif.
    - **Contoh:** "Merasa {{{feeling}}} seringkali terhubung dengan pikiran tertentu. Pikiran apa yang muncul bersamanya saat ini?"
---

Respons Pembuka Anda:`,
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
