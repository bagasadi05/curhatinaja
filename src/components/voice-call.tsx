"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { generateVoiceResponse } from "@/ai/flows/generate-voice-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

// Tambahkan deklarasi global untuk SpeechRecognition jika belum ada
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
    SpeechRecognition: typeof SpeechRecognition;
  }
}

// Gunakan typeof window.SpeechRecognition untuk typing
const SpeechRecognitionClass =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

type ActivityState = "idle" | "listening" | "processing" | "speaking";

const statusMap: Record<ActivityState, string> = {
  idle: "Ketuk ikon untuk memulai",
  listening: "Saya mendengarkan...",
  processing: "Sedang berpikir...",
  speaking: "AI sedang berbicara...",
};

// Komponen BubbleParticles
const BubbleParticles = ({active}: {active: boolean}) => {
  if (!active) return null;
  // 8 bubble dengan posisi dan delay acak
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className={
            `absolute bottom-0 left-1/2 w-6 h-6 rounded-full bg-gradient-to-br
            from-blue-200 via-pink-200 to-purple-200 opacity-70
            blur-sm shadow-lg
            animate-bubble${i}`
          }
          style={{
            transform: `translateX(${(i - 4) * 32}px)`
          }}
        />
      ))}
    </>
  );
};

export function VoiceCall({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityState>("idle");
  const [isSupported, setIsSupported] = React.useState(true);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [voiceGender, setVoiceGender] = React.useState<'female' | 'male'>('female');

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const cleanup = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onstart = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      if (!SpeechRecognitionClass) {
        setIsSupported(false);
        return;
      }
      setIsSupported(true);

      const recognition = new (SpeechRecognitionClass as typeof window.SpeechRecognition)();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setActivity("listening");
        setLastError(null);
      };

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const userTranscript = event.results[0][0].transcript;
        setActivity("processing");

        try {
          const response = await generateVoiceResponse({
            textInput: userTranscript,
          });
          // Pilih voiceName berdasarkan gender
          const voiceName = voiceGender === 'male' ? 'Algenib' : 'Kore';
          const audioResult = await generateAudio({
            text: response.responseText,
            voiceName,
          });
          
          if (audioRef.current) {
            audioRef.current.pause();
          }

          const newAudio = new Audio(audioResult.media);
          audioRef.current = newAudio;

          newAudio.onplay = () => {
            setActivity("speaking");
          };
          
          const onAudioEnd = () => {
            setActivity("idle");
            if (audioRef.current) {
              audioRef.current = null;
            }
          };

          newAudio.onended = onAudioEnd;
          newAudio.onerror = () => {
              console.error("Audio playback error");
              setLastError("Gagal memutar audio.");
              onAudioEnd();
          };

          newAudio.play().catch(onAudioEnd);
        } catch (error) {
          console.error("Gagal memproses respons suara:", error);
          let errorMessage = "Maaf, terjadi kesalahan. Coba lagi.";
          if (error instanceof Error && (error.message.includes("429") || error.message.includes("quota"))) {
             errorMessage = "Layanan suara sedang sibuk. Coba lagi sebentar.";
          }
          setLastError(errorMessage);
          setActivity("idle");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'no-speech') {
            setLastError("Saya tidak mendengar apa-apa. Coba lagi.");
        } else if (event.error === 'not-allowed') {
            setLastError("Izin mikrofon ditolak. Harap izinkan di pengaturan browser Anda.");
        } else {
            setLastError("Terjadi kesalahan pada mikrofon.");
        }
        setActivity("idle");
      };

      recognition.onend = () => {
        setActivity(currentActivity => {
            if (currentActivity === 'listening') return 'idle';
            return currentActivity;
        });
      };

      recognitionRef.current = recognition;
    } else {
      cleanup();
    }

    return cleanup;
  }, [isOpen, cleanup, voiceGender]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      cleanup();
      setActivity("idle");
      setLastError(null);
    }
    setIsOpen(open);
  };

  const isBusy = activity === "processing";
  const status = lastError ?? (isSupported ? statusMap[activity] : "Browser Anda tidak mendukung fitur ini.");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="w-screen h-screen max-w-none max-h-none rounded-none p-0 sm:rounded-3xl sm:p-6 bg-black/90 backdrop-blur-sm border-0"
      >
        {/* DialogTitle untuk aksesibilitas, hidden visual */}
        <DialogTitle className="sr-only">Mode Panggilan Suara</DialogTitle>
        <DialogDescription className="sr-only">
          Dialog panggilan suara. Tekan dan tahan mikrofon untuk berbicara. Transkrip akan muncul di layar.
        </DialogDescription>
        <div className="flex flex-col items-center gap-4 px-4 py-6 w-full h-full justify-center">
          <h2 className="font-poppins text-xl md:text-2xl text-white mt-2 mb-1 text-center">🎙️ Kamu Sedang Curhat Suara...</h2>
          <p className="font-nunito text-base text-blue-100 mb-2 text-center">(Aku di sini untuk mendengarkan)</p>
          <div className="w-full flex justify-center mb-2">
            <select
              className="rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={voiceGender}
              onChange={e => setVoiceGender(e.target.value as 'female' | 'male')}
              disabled={isBusy}
            >
              <option value="female">Cewe (natural)</option>
              <option value="male">Cowo (natural)</option>
            </select>
          </div>
          <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center mb-4">
            {/* Aura Glow */}
            <div className="absolute w-full h-full rounded-full bg-gradient-radial from-pink-400/30 via-blue-400/20 to-purple-400/10 blur-3xl z-0 animate-glow" />
            {/* Lingkaran Utama */}
            <div className={cn(
              "relative w-full h-full rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400 shadow-2xl flex items-center justify-center animate-pulse-glow",
              activity === 'speaking' && 'ring-4 ring-blue-300/40 animate-wave',
            )}>
              {/* Waveform/Expanding Ring */}
              {activity === 'speaking' && (
                <div className="absolute inset-0 rounded-full border-4 border-blue-300/40 animate-wave" />
              )}
              {/* Gelembung 3D */}
              <BubbleParticles active={activity === 'listening' || activity === 'processing'} />
              {/* Ikon Mikrofon */}
              <Mic className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow" />
            </div>
          </div>
          <p className={cn(
            "text-sm font-medium h-5 mt-2 text-white/80 text-center", 
            lastError ? "text-destructive" : "text-muted-foreground"
          )}>
            {status}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
