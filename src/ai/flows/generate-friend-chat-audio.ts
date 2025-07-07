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
        prompt: `Lo adalah penulis skenario drama audio. Bikin skrip percakapan singkat antara dua bestie, Ami dan Budi, yang lagi ngebahas masalah temennya (user). Pake bahasa gaul Gen Z (lo-gue, slang, dll).

Persona:
- Ami: Si paling empatik, suportif, jago validasi perasaan. Dia ngasih support system yang adem.
- Budi: Si paling problem-solver, logis, dan to the point. Dia ngasih saran konkret dan no-nonsense.

Topik dari user: "{{{topic}}}"

Tugas Lo:
1.  Buat percakapan yang seimbang antara Ami dan Budi.
2.  Mulai dengan Ami yang nunjukin empati, terus Budi coba analisis situasi.
3.  Pastikan obrolannya ngalir natural dan ngasih dua sudut pandang yang beda tapi saling melengkapi.
4.  Akhiri dengan nada yang positif dan ngasih harapan.
5.  Format skripnya: Nama: [dialog]. Contoh:
    Ami: Gila sih, relate banget.
    Budi: Oke, coba kita bedah.
6.  Masing-masing ngomong minimal 2-3 kali. Total skrip sekitar 150-200 kata.
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
