"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateVoiceResponse } from "@/ai/flows/generate-voice-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { Phone, Mic, StopCircle, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || (window as any).webkitSpeechRecognition);

type ActivityState = "idle" | "listening" | "processing" | "speaking";

const statusMap: Record<ActivityState, string> = {
  idle: "Ketuk ikon untuk memulai",
  listening: "Saya mendengarkan...",
  processing: "Sedang berpikir...",
  speaking: "AI sedang berbicara...",
};

export function VoiceCall({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityState>("idle");
  const [isSupported, setIsSupported] = React.useState(true);
  const [lastError, setLastError] = React.useState<string | null>(null);

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
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }
      setIsSupported(true);

      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setActivity("listening");
        setLastError(null);
      };

      recognition.onresult = async (event) => {
        const userTranscript = event.results[0][0].transcript;
        setActivity("processing");

        try {
          const response = await generateVoiceResponse({
            textInput: userTranscript,
          });
          
          const audioResult = await generateAudio(response.responseText);
          
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

      recognition.onerror = (event) => {
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
  }, [isOpen, cleanup]);

  const handleMicClick = () => {
    if (activity === 'listening') {
      recognitionRef.current?.stop();
    } else if (activity === 'speaking') {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setActivity('idle');
    } else if (activity === 'idle' && recognitionRef.current) {
      try {
        setLastError(null);
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition:", e);
        setActivity('idle');
      }
    }
  };

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

  const MicButtonIcon = () => {
    if (isBusy) return <LoaderCircle className="w-10 h-10 text-foreground/80 animate-spin" />;
    if (activity === 'speaking' || activity === 'listening') return <StopCircle className="w-10 h-10 text-white" />;
    return <Mic className="w-10 h-10 text-white" />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-lg w-full h-[90vh] max-h-[700px] flex flex-col p-0 bg-black/90 backdrop-blur-sm border-0"
      >
        <DialogHeader className="p-6 pb-2 absolute top-0 left-0 right-0 z-10 bg-transparent">
          <DialogTitle className="font-headline text-xl flex items-center gap-3 text-white/90">
            <Phone className="w-5 h-5 text-primary" />
            Mode Panggilan Suara
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            <div className={cn(
              "relative w-56 h-56 md:w-64 md:h-64 rounded-full transition-all duration-500 ease-in-out flex items-center justify-center",
              (activity === 'speaking') && 'animate-orb-pulse',
              activity === 'listening' && 'animate-orb-listening',
            )}>
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-blue-500/60 via-purple-500/40 to-transparent blur-2xl"></div>
              <div className={cn(
                  "absolute inset-2 rounded-full bg-gradient-radial from-blue-400 to-purple-600 transition-all duration-300",
                   activity === 'processing' && 'animate-orb-swirl'
              )}></div>
               {activity === 'processing' && (
                  <LoaderCircle className="w-12 h-12 text-white/80 animate-spin-slow z-10" />
              )}
            </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-transparent z-10">
           <p className={cn(
               "text-sm font-medium h-5 mb-4 transition-colors text-white/70", 
               lastError ? "text-destructive" : "text-muted-foreground"
            )}>
              {status}
            </p>
          <Button
            size="icon"
            className={cn(
              "rounded-full w-20 h-20 transition-all duration-300 shadow-2xl border-4 border-black/30",
              "focus-visible:ring-4 focus-visible:ring-primary/50",
              activity === "listening" && "bg-destructive hover:bg-destructive/90 animate-shadow-pulse",
              activity === 'speaking' && "bg-blue-500 hover:bg-blue-600",
              (activity === 'idle' && !lastError) && "bg-primary hover:bg-primary/90",
              lastError && "bg-yellow-500 hover:bg-yellow-600",
              isBusy && "bg-muted cursor-not-allowed"
            )}
            onClick={handleMicClick}
            disabled={!isSupported || isBusy}
          >
            <MicButtonIcon />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
