'use server';

/**
 * @fileOverview Menghasilkan diskusi audio antara dua persona AI.
 *
 * - generateFriendChatAudio - Fungsi yang menerima topik dari pengguna, menghasilkan skrip percakapan, dan mengubahnya menjadi audio multi-speaker.
 * - GenerateFriendChatAudioInput - Tipe input untuk fungsi.
 * - GenerateFriendChatAudioOutput - Tipe kembalian untuk fungsi.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

// Input Schema
const GenerateFriendChatAudioInputSchema = z.object({
  topic: z.string().describe('Topik atau masalah yang akan didiskusikan oleh AI.'),
});
export type GenerateFriendChatAudioInput = z.infer<typeof GenerateFriendChatAudioInputSchema>;

// Output Schema
const GenerateFriendChatAudioOutputSchema = z.object({
  script: z.string().describe('Skrip percakapan yang dihasilkan.'),
  audioUri: z.string().describe('Audio percakapan sebagai data URI WAV base64.'),
});
export type GenerateFriendChatAudioOutput = z.infer<typeof GenerateFriendChatAudioOutputSchema>;

// Exported function that the client will call
export async function generateFriendChatAudio(
  input: GenerateFriendChatAudioInput
): Promise<GenerateFriendChatAudioOutput> {
  return friendChatFlow(input);
}

// Helper to convert PCM to WAV
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

// The main flow
const friendChatFlow = ai.defineFlow(
  {
    name: 'friendChatFlow',
    inputSchema: GenerateFriendChatAudioInputSchema,
    outputSchema: GenerateFriendChatAudioOutputSchema,
  },
  async ({ topic }) => {
    // 1. Generate the conversation script
    const scriptPrompt = ai.definePrompt({
        name: 'friendChatScriptPrompt',
        input: { schema: z.object({ topic: z.string() }) },
        output: { schema: z.object({ script: z.string() }) },
        prompt: `Anda adalah penulis skenario untuk drama audio pendek.
Tulis skrip percakapan antara dua teman, Ami dan Budi, yang sedang mendiskusikan masalah yang dihadapi teman mereka (pengguna).

Persona:
- Ami: Sangat empatik, suportif, dan fokus pada validasi perasaan. Dia menawarkan kenyamanan dan perspektif yang lembut.
- Budi: Lebih analitis, praktis, dan fokus pada solusi. Dia menawarkan langkah-langkah konkret dan saran yang membangun.

Topik dari pengguna: "{{{topic}}}"

Tugas Anda:
1.  Buatlah percakapan yang seimbang antara Ami dan Budi dalam Bahasa Indonesia.
2.  Mulailah dengan Ami yang menunjukkan empati, diikuti oleh Budi yang mencoba menganalisis situasi.
3.  Pastikan percakapan mengalir secara alami dan memberikan perspektif yang berbeda namun saling melengkapi.
4.  Akhiri percakapan dengan nada yang positif dan memberi harapan.
5.  Format skrip dengan nama pembicara diikuti oleh titik dua, seperti ini:
    Ami: [dialog Ami]
    Budi: [dialog Budi]
6.  Setiap pembicara harus berbicara setidaknya 2-3 kali. Total panjang skrip sekitar 150-200 kata.
`,
    });
    
    const { output: scriptOutput } = await scriptPrompt({ topic });
    if (!scriptOutput) {
      throw new Error("Gagal menghasilkan skrip percakapan.");
    }
    const originalScript = scriptOutput.script;

    // 2. Format script for multi-speaker TTS
    const ttsScript = originalScript
      .replace(/Ami:/g, 'Speaker1:')
      .replace(/Budi:/g, 'Speaker2:');

    // 3. Generate multi-speaker audio
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker1', // Ami
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
              },
              {
                speaker: 'Speaker2', // Budi
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } },
              },
            ],
          },
        },
      },
      prompt: ttsScript,
    });

    if (!media) {
      throw new Error('Tidak ada media audio yang dikembalikan dari model.');
    }

    // 4. Convert to WAV and return
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      script: originalScript,
      audioUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
