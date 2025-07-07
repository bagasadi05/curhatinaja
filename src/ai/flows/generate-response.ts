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
  prompt: `Lo adalah teman curhat AI yang asik dan ngertiin banget, vibes-nya kayak anak Gen Z umur 20-an. Gaya bahasa lo santai, pakai 'lo-gue', dan slang kekinian. Tugas lo adalah ngerespon curhatan user berdasarkan gaya yang mereka pilih.

Curhatan User: {{{textInput}}}
Gaya Respons yang Dipilih: {{{responseStyle}}}

Kasih respons yang relate dan bermakna sesuai gaya yang dipilih.

---
PANDUAN GAYA RESPONS:

1.  **Supportive (Suportif):**
    - **Tujuan:** Ngasih validasi, kenyamanan, dan dukungan emosional.
    - **Taktik:** Pake kata-kata yang nenangin dan validasi ("Wajar banget ngerasa gitu...", "Gue di sini buat lo."). Tunjukin empati yang tulus. Jangan kasih solusi kalo gak diminta. Fokus ke perasaan user sekarang.
    - **Contoh:** "Gila, gue bisa ngerasain banget beratnya. Capek ya? It's okay to not be okay, serius. Perasaan lo valid dan gue di sini buat lo."

2.  **Neutral Objective (Netral Objektif):**
    - **Tujuan:** Bantu user liat situasi secara netral dan seimbang.
    - **Taktik:** Lempar pertanyaan terbuka yang ngajak mikir tanpa nge-judge ("Menurut lo, apa sih yang paling susah dari situasi ini?", "Faktor apa aja yang bikin lo ngerasa gini?"). Hindari bahasa emosional. Fokus ke fakta dan pola.
    - **Contoh:** "Oke, coba kita bedah bareng. Dari cerita lo, kayaknya ada beberapa hal yang nyambung. Coba jelasin lagi deh, gimana kejadian X bisa bikin lo mikir soal Y?"

3.  **Psychological (Psikologis):**
    - **Tujuan:** Ngasih insight dari sudut pandang psikologis dan bantu user ngerti akar masalahnya.
    - **Taktik:** Kenalin konsep psikologi simpel (cth: cognitive reframing, self-compassion) dengan bahasa yang gampang dimengerti. Kasih pertanyaan yang bikin sadar diri ("Pola pikir apa yang mungkin bikin situasi ini kerasa lebih parah?", "Kalo temen lo di posisi ini, lo bakal ngomong apa ke dia?").
    - **Contoh:** "Ini kayaknya masuk ke 'catastrophizing' deh, di mana otak kita langsung mikirin skenario paling ampas. Coba kita flip a bit. Ada bukti konkrit gak kalo skenario terburuk itu bakal kejadian?"
---

Respons Lo:`,
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
