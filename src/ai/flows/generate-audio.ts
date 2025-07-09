'use server';
/**
 * @fileOverview A flow for generating audio from text.
 *
 * - generateAudio - A function that converts text to speech.
 * - GenerateAudioInput - The input type for the generateAudio function.
 * - GenerateAudioOutput - The return type for the generateAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

const GenerateAudioInputSchema = z.object({
  text: z.string().optional(),
  ssml: z.string().optional(),
  inputType: z.enum(['text', 'ssml']).default('text'),
  voiceName: z.string().optional(),
});
export type GenerateAudioInput = {
  text?: string;
  ssml?: string;
  inputType: 'text' | 'ssml';
  voiceName?: string;
};

const GenerateAudioOutputSchema = z.object({
  media: z
    .string()
    .describe('The generated audio as a base64 encoded WAV data URI.'),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;

export async function generateAudio(
  input: GenerateAudioInput
): Promise<GenerateAudioOutput> {
  // Pastikan inputType selalu ada
  return generateAudioFlow({ ...input, inputType: input.inputType ?? 'text' });
}

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
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async ({text, ssml, inputType = 'text', voiceName}) => {
    const selectedVoice = voiceName || 'Kore';
    const inputContent = inputType === 'ssml' ? ssml : text;
    
    if (!inputContent) {
      throw new Error('No text or SSML content provided');
    }

    // Retry logic untuk menangani quota exceeded
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Coba model utama terlebih dahulu
        let modelToUse = googleAI.model('gemini-2.5-flash-preview-tts');
        
        // Jika attempt > 1, coba model alternatif
        if (attempt > 1) {
          try {
            modelToUse = googleAI.model('gemini-1.5-flash-preview-tts');
          } catch {
            // Jika model alternatif tidak tersedia, tetap gunakan model utama
            modelToUse = googleAI.model('gemini-2.5-flash-preview-tts');
          }
        }

        const {media} = await ai.generate({
          model: modelToUse,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {voiceName: selectedVoice},
              },
            },
          },
          prompt: inputContent,
        });
        
        if (!media) {
          throw new Error('No audio media was returned from the model.');
        }
        
        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        const wavBase64 = await toWav(audioBuffer);
        return {
          media: `data:audio/wav;base64,${wavBase64}`,
        };
        
      } catch (error: any) {
        lastError = error;
        
        // Cek apakah error terkait quota atau rate limit
        if (error.message?.includes('429') || 
            error.message?.includes('quota') || 
            error.message?.includes('rate limit')) {
          
          if (attempt < maxRetries) {
            // Exponential backoff: 2^attempt * 1000ms
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Quota exceeded, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            // Jika sudah max retries, throw error yang lebih user-friendly
            throw new Error('Layanan suara sedang sibuk. Silakan coba lagi dalam beberapa menit.');
          }
        } else {
          // Error lain, langsung throw
          throw error;
        }
      }
    }
    
    throw lastError;
  }
);
