"use client";

import { useState, useEffect, useRef } from "react";
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
import { generateResponse } from "@/ai/flows/generate-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { Phone, Mic, MicOff, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || (window as any).webkitSpeechRecognition));

export function VoiceCall() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [status, setStatus] = useState("Ketuk untuk berbicara");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Effect for initializing SpeechRecognition
  useEffect(() => {
    if (!isOpen) return;

    if (!SpeechRecognition) {
      setStatus("Maaf, browsermu tidak mendukung fitur suara.");
      setIsReady(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setAiResponse("");
      setStatus("Mendengarkan...");
    };

    recognition.onresult = async (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      setIsListening(false);
      setIsProcessing(true);
      setStatus("Sedang berpikir...");

      try {
        const response = await generateResponse({
          textInput: currentTranscript,
          responseStyle: "Supportive", // Default style for voice
        });
        setAiResponse(response.responseText);
        setStatus("Menyiapkan audio...");

        const audioResult = await generateAudio(response.responseText);
        if (audioRef.current) {
          audioRef.current.src = audioResult.media;
          audioRef.current.play();
        }
      } catch (error) {
        console.error("Gagal memproses respons suara:", error);
        setStatus("Oops, terjadi kesalahan. Coba lagi.");
        setIsProcessing(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'no-speech') {
        setStatus("Saya tidak mendengar apa-apa. Ketuk untuk mencoba lagi.");
      } else if (event.error === 'not-allowed') {
        setStatus("Akses mikrofon ditolak. Periksa pengaturan browser.");
        setIsReady(false);
      } else {
        setStatus("Tidak bisa mendengar. Coba lagi.");
      }
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsReady(true);

  }, [isOpen]);

  // Effect for handling audio playback events
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
        const handlePlay = () => {
            setIsSpeaking(true);
            setStatus("AI sedang berbicara...");
        };
        const handleEnded = () => {
            setIsSpeaking(false);
            setIsProcessing(false);
            setStatus("Ketuk untuk berbicara");
        };
        audioEl.addEventListener('play', handlePlay);
        audioEl.addEventListener('ended', handleEnded);
        return () => {
          if (audioEl) {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('ended', handleEnded);
          }
        }
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current || !isReady) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else if (!isProcessing && !isSpeaking) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setIsListening(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && (isListening || isProcessing || isSpeaking)) {
      recognitionRef.current?.stop();
      if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    }
    setIsOpen(open);
    // Reset state on close
    if (!open) {
        setTranscript("");
        setAiResponse("");
        setStatus("Ketuk untuk berbicara");
        setIsListening(false);
        setIsProcessing(false);
        setIsSpeaking(false);
        setIsReady(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start p-4 h-auto text-base gap-4 bg-secondary border-secondary/50 shadow-md">
            <Phone className="w-6 h-6 text-primary" />
            <div className="text-left">
                <p className="font-headline text-foreground">Mode Telepon</p>
                <p className="text-xs text-muted-foreground">Bicara langsung dengan AI.</p>
            </div>
        </Button>
      </DialogTrigger>
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
                    isListening ? "border-red-500 bg-red-500/20" : "border-primary bg-primary/20",
                    (isProcessing || isSpeaking) && "animate-pulse"
                )}
                onClick={handleMicClick}
                disabled={!isReady || isProcessing || isSpeaking}
            >
                { isProcessing || isSpeaking ? <LoaderCircle className="w-12 h-12 animate-spin" /> :
                  isListening ? <MicOff className="w-12 h-12 text-red-500" /> : <Mic className="w-12 h-12 text-primary" />
                }
            </Button>
            <p className="text-lg font-medium text-foreground h-6">{status}</p>

            <div className="w-full text-left space-y-4 px-4 h-40 overflow-y-auto">
                {transcript && <p><span className="font-bold">Anda:</span> {transcript}</p>}
                {aiResponse && <p><span className="font-bold">AI:</span> {aiResponse}</p>}
            </div>
        </div>

        <DialogFooter>
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>Tutup</Button>
        </DialogFooter>
        <audio ref={audioRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
