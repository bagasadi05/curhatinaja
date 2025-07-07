"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateResponse } from "@/ai/flows/generate-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { customizeAIResponseStyle } from "@/ai/flows/customize-response-style";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DailyAffirmation } from "@/components/daily-affirmation";
import { EmotionJournal } from "@/components/emotion-journal";
import { PanicModal } from "@/components/panic-modal";
import { VoiceCall } from "@/components/voice-call";
import { ChibiIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bot, Pause, Send, User, Volume2, Menu, AlertCircle, Sparkles, BookHeart, Phone } from "lucide-react";

const chatFormSchema = z.object({
  textInput: z.string().min(1, "Pesan tidak boleh kosong."),
  responseStyle: z.enum(["Supportive", "Neutral Objective", "Psychological"]),
});

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "loading";
  content: string;
  audioUrl?: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      textInput: "",
      responseStyle: "Supportive",
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      const handleEnded = () => setPlayingId(null);
      audioEl.addEventListener('ended', handleEnded);
      return () => {
        audioEl.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const handlePlayPause = (id: string, url?: string) => {
    if (!url) return;
    
    const currentAudio = audioRef.current;
    if (playingId === id && currentAudio) {
      currentAudio.pause();
      setPlayingId(null);
    } else {
      if (currentAudio) {
        currentAudio.pause();
      }
      const newAudio = new Audio(url);
      newAudio.play();
      newAudio.onended = () => setPlayingId(null);
      audioRef.current = newAudio;
      setPlayingId(id);
    }
  };

  async function onSubmit(values: z.infer<typeof chatFormSchema>) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: values.textInput,
    };
    const loadingMessage: ChatMessage = {
      id: `load-${Date.now()}`,
      role: "loading",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    form.resetField("textInput");

    try {
      const result = await generateResponse(values);
      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: result.responseText,
      };
      setMessages((prev) =>
        prev.filter((m) => m.role !== "loading").concat(assistantMessage)
      );

      generateAudio(result.responseText)
        .then(audioResult => {
            setMessages(prev => prev.map(m =>
                m.id === assistantMessage.id ? { ...m, audioUrl: audioResult.media } : m
            ));
        })
        .catch(err => {
            console.error("Gagal membuat audio:", err);
            if (err instanceof Error && (err.message.includes("429") || err.message.includes("quota"))) {
                toast({
                    title: "Audio Gagal Dibuat",
                    description: "Layanan suara sedang sibuk. Coba lagi sebentar.",
                    variant: "destructive",
                });
            }
        });

    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Maaf, saya sedang mengalami sedikit masalah saat ini. Silakan coba lagi sebentar lagi.",
      };
      setMessages((prev) =>
        prev.filter((m) => m.role !== "loading").concat(errorMessage)
      );
    }
  }

  async function handleEmotionLogged(feelingValue: number) {
    setIsJournalOpen(false); // Close the dialog

    const feelingMap: { [key: string]: string } = {
        low: "sedih atau kurang bersemangat",
        medium: "merasa biasa saja",
        high: "merasa baik atau bersemangat",
    };

    let feelingDescription: string;
    if (feelingValue < 33) feelingDescription = feelingMap.low;
    else if (feelingValue < 66) feelingDescription = feelingMap.medium;
    else feelingDescription = feelingMap.high;

    const proactiveIntro = `Aku melihat kamu baru saja mencatat bahwa kamu ${feelingDescription}.`;

    const loadingMessage: ChatMessage = {
        id: `load-${Date.now()}`,
        role: "loading",
        content: "",
    };
    setMessages((prev) => [...prev, {id: `intro-${Date.now()}`, role: 'assistant', content: proactiveIntro}, loadingMessage]);

    try {
        const result = await customizeAIResponseStyle({
            feeling: feelingDescription,
            responseStyle: form.getValues("responseStyle"),
        });
        
        const assistantMessage: ChatMessage = {
            id: `asst-${Date.now()}`,
            role: "assistant",
            content: result.response,
        };

        // Replace loading message with the actual response, but keep the intro.
        setMessages((prev) => prev.filter((m) => m.role !== "loading").concat(assistantMessage));

        generateAudio(proactiveIntro + " " + result.response)
            .then(audioResult => {
                setMessages(prev => {
                    // This is complex. For now, let's just add audio to the last message.
                    // A better implementation would combine the two messages into one.
                    return prev.map(m => m.id === assistantMessage.id ? { ...m, audioUrl: audioResult.media } : m)
                });
            });

    } catch (error) {
        console.error("Error generating proactive response:", error);
        setMessages((prev) => prev.filter((m) => m.role !== "loading" && m.id !== `intro-${Date.now()}`));
        toast({
            title: "Gagal Merespons",
            description: "Maaf, saya tidak dapat merespons catatan jurnal Anda saat ini.",
            variant: "destructive"
        });
    }
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Buka Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-4 w-[300px] sm:w-[320px] bg-secondary border-r-border/50">
            <SheetHeader>
              <SheetTitle className="font-sans font-semibold text-2xl text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-base p-3 h-auto"><Sparkles className="mr-3 h-5 w-5 text-primary"/> Afirmasi Harian</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Afirmasi Harian</DialogTitle>
                      <DialogDescription className="sr-only">
                        Menampilkan afirmasi harian untuk motivasi dan mengatur notifikasi.
                      </DialogDescription>
                    </DialogHeader>
                    <DailyAffirmation />
                  </DialogContent>
                </Dialog>
                <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-base p-3 h-auto"><BookHeart className="mr-3 h-5 w-5 text-primary"/> Jurnal Emosi</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Jurnal Emosi</DialogTitle>
                      <DialogDescription className="sr-only">
                        Catat dan lihat tren emosi harianmu.
                      </DialogDescription>
                    </DialogHeader>
                    <EmotionJournal onLog={handleEmotionLogged} />
                  </DialogContent>
                </Dialog>
                <Separator className="my-2 bg-border/50" />
                <VoiceCall>
                    <Button variant="ghost" className="w-full justify-start text-base p-3 h-auto"><Phone className="mr-3 h-5 w-5 text-primary"/> Mode Telepon</Button>
                </VoiceCall>
                <Separator className="my-2 bg-border/50" />
                <PanicModal>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base p-3 h-auto text-destructive hover:bg-destructive/10 hover:text-destructive focus:text-destructive"
                  >
                    <AlertCircle className="mr-3 h-5 w-5" />
                    Dukungan Cepat
                  </Button>
                </PanicModal>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="text-center">
          <h2 className="text-xl font-sans font-semibold text-foreground">
            CurhatinAja
          </h2>
          <p className="text-sm font-sans text-muted-foreground -mt-1">Aku di sini untuk mendengarkan...</p>
        </div>

        <ThemeToggle />
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="px-4 space-y-6 py-6">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                    <ChibiIcon className="w-32 h-32 text-primary/80 animate-slow-breathe" />
                    <p className="font-headline text-xl mt-4">Aku di sini untuk mendengarkan.</p>
                    <p>Ketik pesan pertamamu di bawah untuk memulai.</p>
                </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" && "justify-end"
                )}
              >
                {message.role !== "user" && (
                  <Avatar className="h-9 w-9 bg-primary text-primary-foreground">
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={cn(
                    "max-w-md rounded-xl shadow-lg",
                    message.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  )}
                >
                  <CardContent className="p-3">
                    {message.role === "loading" ? (
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                        {message.role === 'assistant' && message.audioUrl && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                onClick={() => handlePlayPause(message.id, message.audioUrl)}
                            >
                                {playingId === message.id ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                {message.role === "user" && (
                  <Avatar className="h-9 w-9 bg-accent text-accent-foreground">
                    <AvatarFallback>
                        <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-end gap-2"
          >
            <FormField
              control={form.control}
              name="textInput"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Ketik pesanmu di sini..."
                      className="min-h-[40px] resize-none focus-visible:ring-2 p-3 bg-secondary rounded-lg shadow-sm"
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="responseStyle"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[150px] bg-secondary shadow-sm">
                          <SelectValue placeholder="Gaya Respon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Supportive">Suportif</SelectItem>
                        <SelectItem value="Neutral Objective">Netral Objektif</SelectItem>
                        <SelectItem value="Psychological">Psikologis</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="default"
                className="h-10 bg-primary hover:bg-primary/90"
                disabled={form.formState.isSubmitting}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
