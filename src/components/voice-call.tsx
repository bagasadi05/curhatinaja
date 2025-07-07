"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  idle: "Ketuk ikon mikrofon untuk memulai",
  listening: "Saya mendengarkan...",
  processing: "Sedang berpikir...",
  speaking: "AI sedang berbicara...",
};

export function VoiceCall({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityState>("idle");
  const [isSupported, setIsSupported] = React.useState(true);
  const [conversation, setConversation] = React.useState<{speaker: 'user' | 'ai', text: string}[]>([]);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const conversationEndRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

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
        setConversation(prev => [...prev, { speaker: 'user', text: userTranscript }]);
        setActivity("processing");

        try {
          const response = await generateVoiceResponse({
            textInput: userTranscript,
          });
          
          setConversation(prev => [...prev, { speaker: 'ai', text: response.responseText }]);

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
          setConversation(prev => [...prev, { speaker: 'ai', text: errorMessage }]);
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
      setConversation([]);
      setLastError(null);
    }
    setIsOpen(open);
  };

  const isBusy = activity === "processing";
  const status = lastError ?? (isSupported ? statusMap[activity] : "Browser Anda tidak mendukung fitur ini.");

  const MicButtonIcon = () => {
    if (isBusy) return <LoaderCircle className="w-10 h-10 text-foreground/80 animate-spin" />;
    if (activity === 'speaking') return <StopCircle className="w-10 h-10 text-white" />;
    return <Mic className="w-10 h-10 text-white" />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-lg h-[80vh] flex flex-col p-0 bg-background"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 100%, hsl(var(--primary) / 0.1), transparent 60%)'
        }}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-2xl flex items-center gap-3">
            <Phone className="w-6 h-6 text-primary" />
            Mode Panggilan Suara
          </DialogTitle>
          <DialogDescription>
            Bicaralah, dan AI akan merespons. Anda dapat mengetuk tombol untuk menyela.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden px-6">
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
                {conversation.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <p className="text-lg">Mulai percakapan...</p>
                    </div>
                )}
                {conversation.map((entry, index) => (
                    <div key={index} className={cn("flex w-full", entry.speaker === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                            "max-w-[80%] px-4 py-3 shadow-xl",
                             entry.speaker === 'user' 
                                ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-3xl rounded-br-lg' 
                                : 'bg-gradient-to-br from-secondary to-background text-foreground rounded-3xl rounded-bl-lg'
                        )}>
                            <p className="drop-shadow-sm">{entry.text}</p>
                        </div>
                    </div>
                ))}
                 <div ref={conversationEndRef} />
            </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-transparent">
           <p className={cn(
               "text-sm font-medium h-5 mb-4 transition-colors", 
               lastError ? "text-destructive" : "text-muted-foreground"
            )}>
              {status}
            </p>
          <Button
            size="icon"
            className={cn(
              "rounded-full w-20 h-20 transition-all duration-300 shadow-2xl border-4 border-background/50",
              "focus-visible:ring-4 focus-visible:ring-primary/50",
              activity === "listening" && "bg-destructive hover:bg-destructive/90 animate-shadow-pulse",
              activity === 'speaking' && "bg-blue-500 hover:bg-blue-600",
              activity === 'idle' && "bg-primary hover:bg-primary/90",
              activity === 'processing' && "bg-muted cursor-not-allowed"
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
