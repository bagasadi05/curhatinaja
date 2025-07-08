"use client";

import * as React from "react";
import {
  generateVoiceResponse
} from "@/ai/flows/generate-voice-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

// Deklarasi type manual untuk SpeechRecognition dan event-nya, tanpa any
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

// Tambahkan deklarasi global untuk SpeechRecognition jika belum ada
declare global {
  interface Window {
    webkitSpeechRecognition: unknown;
    SpeechRecognition: unknown;
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

export function VoiceCall({ onClose }: { onClose: () => void }) {
  const [activity, setActivity] = React.useState<ActivityState>("idle");
  const [isSupported, setIsSupported] = React.useState(true);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [permission, setPermission] = React.useState<'prompt' | 'granted' | 'denied'>('prompt');
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
    return cleanup;
  }, [cleanup]);

  React.useEffect(() => {
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    // Type guard agar tidak error 'unknown'
    let recognition: SpeechRecognition;
    if (typeof SpeechRecognitionClass === 'function') {
      recognition = new (SpeechRecognitionClass as { new(): SpeechRecognition })();
    } else {
      setIsSupported(false);
      return;
    }

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
        const voiceName = voiceGender === 'male' ? 'Algenib' : 'Kore';
        const audioResult = await generateAudio({
          text: response.responseText,
          voiceName,
        });
        
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioResult.media);
        audioRef.current = audio;

        audio.onplay = () => {
          setActivity("speaking");
        };

        const onAudioEnd = () => {
          setActivity("idle");
          audio.removeEventListener('ended', onAudioEnd);
          audio.removeEventListener('error', onError);
        };

        const onError = () => {
          setLastError("Gagal memutar audio respons.");
          onAudioEnd();
        }

        audio.addEventListener('ended', onAudioEnd);
        audio.addEventListener('error', onError);
        
        audio.play().catch(onError);

      } catch (error) {
        console.error("Voice call error:", error);
        setLastError("Maaf, terjadi kesalahan saat memproses permintaanmu.");
        setActivity("idle");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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

    return cleanup;
  }, [cleanup, voiceGender]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the track immediately once we have permission
      setPermission('granted');
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);
      setLastError("Izin mikrofon ditolak. Harap izinkan di pengaturan browser Anda.");
      setPermission('denied');
      return false;
    }
  };

  const handleMicClick = async () => {
    if (activity === 'listening') {
      recognitionRef.current?.stop();
      return;
    }

    if (activity === 'idle') {
      let hasPermission = permission === 'granted';
      if (permission !== 'granted') {
        hasPermission = await requestMicrophonePermission();
      }

      if (hasPermission) {
        recognitionRef.current?.start();
      }
    }
  };

  const isBusy = activity === "processing" || activity === "speaking";
  const status = lastError ?? (isSupported ? statusMap[activity] : "Browser Anda tidak mendukung fitur ini.");

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4 sm:py-6 w-full h-full justify-center bg-black/90">
      <h2 className="font-poppins text-xl md:text-2xl text-white mt-2 mb-1 text-center">🎙️ Kamu Sedang Curhat Suara...</h2>
      <p className="font-nunito text-base text-blue-100 mb-2 text-center">(Aku di sini untuk mendengarkan)</p>
      <div className="w-full flex justify-center mb-2">
        <select
          className="rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white border-gray-600"
          value={voiceGender}
          onChange={e => setVoiceGender(e.target.value as 'female' | 'male')}
          disabled={isBusy}
        >
          <option value="female">Cewe (natural)</option>
          <option value="male">Cowo (natural)</option>
        </select>
      </div>
      <button 
        onClick={handleMicClick} 
        disabled={isBusy}
        className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center mb-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-primary disabled:cursor-not-allowed"
      >
        {/* Aura Glow */}
        <div className="absolute w-full h-full rounded-full bg-gradient-radial from-pink-400/30 via-blue-400/20 to-purple-400/10 blur-3xl z-0 animate-glow" />
        {/* Lingkaran Utama */}
        <div className={cn(
          "relative w-full h-full rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400 shadow-2xl flex items-center justify-center transition-all duration-300",
          activity === 'speaking' && 'ring-4 ring-blue-300/40 animate-wave',
          activity === 'listening' && 'scale-110',
          isBusy && 'opacity-70'
        )}>
          {/* Waveform/Expanding Ring */}
          {activity === 'speaking' && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-300/40 animate-wave" />
          )}
          {/* Gelembung 3D */}
          <BubbleParticles active={activity === 'listening' || activity === 'processing'} />
          {/* Ikon Mikrofon */}
          <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-white drop-shadow" />
        </div>
      </button>
      <p className={cn(
        "text-sm font-medium h-5 mt-2 text-white/80 text-center", 
        lastError ? "text-destructive" : "text-muted-foreground"
      )}>
        {status}
      </p>
      <div className="mt-auto w-full max-w-xs px-4 pb-4">
        <Button variant="secondary" onClick={onClose} className="w-full">Tutup</Button>
      </div>
    </div>
  );
}
