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
  DialogFooter,
} from "@/components/ui/dialog";
import { generateVoiceResponse } from "@/ai/flows/generate-voice-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { Phone, Mic, MicOff, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || (window as any).webkitSpeechRecognition);

type ActivityState = "idle" | "listening" | "processing" | "speaking";

const statusMap: Record<ActivityState, string> = {
  idle: "Ketuk untuk berbicara",
  listening: "Mendengarkan...",
  processing: "Sedang berpikir...",
  speaking: "AI sedang berbicara...",
};

export function VoiceCall({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityState>("idle");
  const [isSupported, setIsSupported] = React.useState(true);
  const [transcript, setTranscript] = React.useState("");
  const [aiResponse, setAiResponse] = React.useState("");

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const cleanup = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
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
        setTranscript("");
        setAiResponse("");
      };

      recognition.onresult = async (event) => {
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);
        setActivity("processing");

        try {
          const response = await generateVoiceResponse({
            textInput: currentTranscript,
          });
          setAiResponse(response.responseText);

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
              onAudioEnd();
          };

          newAudio.play().catch(onAudioEnd);
        } catch (error) {
          console.error("Gagal memproses respons suara:", error);
          setActivity("idle");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setActivity("idle");
      };

      recognition.onend = () => {
        setActivity((currentActivity) =>
          currentActivity === "listening" ? "idle" : currentActivity
        );
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
      return;
    }

    if (activity === 'idle' && recognitionRef.current) {
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
      setTranscript("");
      setAiResponse("");
    }
    setIsOpen(open);
  };

  const isBusy = activity === "processing" || activity === "speaking";
  const status = isSupported ? statusMap[activity] : "Browser tidak mendukung";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Phone className="w-6 h-6 text-primary" />
            Mode Telepon
          </DialogTitle>
          <DialogDescription>
            Bicaralah, dan AI akan merespons dengan suara.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full w-28 h-28 border-4 transition-all duration-300",
              activity === "listening"
                ? "border-red-500 bg-red-500/20"
                : "border-primary bg-primary/20",
              isBusy && "animate-pulse"
            )}
            onClick={handleMicClick}
            disabled={!isSupported || isBusy}
          >
            {isBusy ? (
              <LoaderCircle className="w-12 h-12 animate-spin" />
            ) : activity === "listening" ? (
              <MicOff className="w-12 h-12 text-red-500" />
            ) : (
              <Mic className="w-12 h-12 text-primary" />
            )}
          </Button>
          <p className="text-lg font-medium text-foreground h-6">{status}</p>

          <div className="w-full text-left space-y-4 px-4 h-40 overflow-y-auto">
            {transcript && (
              <p>
                <span className="font-bold">Anda:</span> {transcript}
              </p>
            )}
            {aiResponse && (
              <p>
                <span className="font-bold">AI:</span> {aiResponse}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
