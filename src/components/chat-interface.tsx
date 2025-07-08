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
import { ChibiIcon } from "@/components/icons";
import { Bot, Pause, Send, User, Volume2 } from "lucide-react";

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

export type ChatInterfaceHandles = {
  handleEmotionLogged: (feelingLabel: string) => Promise<void>;
};

type WindowWithHandleEmotionLogged = Window & { handleEmotionLogged?: (feelingLabel: string) => Promise<void> };

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

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
      newAudio.play().catch(err => {
        console.error("Gagal memutar audio:", err);
        toast({
            title: "Gagal Memutar Audio",
            description: "Tidak dapat memutar file audio saat ini.",
            variant: "destructive",
        });
        setPlayingId(null);
      });
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

      generateAudio({
        text: result.responseText,
        voiceName: voiceGender === 'female' ? 'Kore' : 'Algenib',
      })
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

  const handleEmotionLogged = async (feelingLabel: string) => {
    const proactiveIntro = `Aku melihat kamu baru saja mencatat bahwa kamu merasa ${feelingLabel.toLowerCase()}.`;

    const loadingMessage: ChatMessage = {
        id: `load-${Date.now()}`,
        role: "loading",
        content: "",
    };
    setMessages((prev) => [...prev, {id: `intro-${Date.now()}`, role: 'assistant', content: proactiveIntro}, loadingMessage]);

    try {
        const result = await customizeAIResponseStyle({
            feeling: feelingLabel,
            responseStyle: form.getValues("responseStyle"),
        });
        
        const assistantMessage: ChatMessage = {
            id: `asst-${Date.now()}`,
            role: "assistant",
            content: result.response,
        };

        setMessages((prev) => prev.filter((m) => m.role !== "loading").concat(assistantMessage));

        generateAudio(proactiveIntro + " " + result.response)
            .then(audioResult => {
                setMessages(prev => {
                    return prev.map(m => m.id === assistantMessage.id ? { ...m, audioUrl: audioResult.media } : m)
                });
            })
            .catch(err => {
                console.error("Gagal membuat audio untuk respons proaktif:", err);
            });

    } catch (error) {
        console.error("Error generating proactive response:", error);
        setMessages((prev) => prev.filter((m) => m.role !== "loading" && !m.id.startsWith('intro-')));
        toast({
            title: "Gagal Merespons",
            description: "Maaf, saya tidak dapat merespons catatan jurnal Anda saat ini.",
            variant: "destructive"
        });
    }
  };
  
  (window as WindowWithHandleEmotionLogged).handleEmotionLogged = handleEmotionLogged;

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="px-4 space-y-8 py-10">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20 animate-fade-in">
                    <ChibiIcon className="w-32 h-32 text-primary/80 animate-slow-breathe" />
                    <p className="font-headline text-2xl mt-4 text-primary">Aku di sini untuk mendengarkan.</p>
                    <p className="text-lg">Ketik pesan pertamamu di bawah untuk memulai curhat. Semua cerita kamu aman di sini.</p>
                </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-4 transition-all duration-300 animate-fade-in",
                  message.role === "user" && "justify-end"
                )}
              >
                {message.role !== "user" && (
                  <Avatar className="h-10 w-10 bg-primary text-primary-foreground shadow-lg">
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={cn(
                    "max-w-md rounded-2xl shadow-xl border-2 border-border/60 transition-all duration-300",
                    message.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-md border-primary/30"
                      : "bg-secondary text-secondary-foreground rounded-bl-md border-secondary/40"
                  )}
                >
                  <CardContent className="p-4">
                    {message.role === "loading" ? (
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="whitespace-pre-wrap flex-1 text-base leading-relaxed">{message.content}</p>
                        {message.role === 'assistant' && message.audioUrl && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
                  <Avatar className="h-10 w-10 bg-accent text-accent-foreground shadow-lg">
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
            className="flex items-end gap-3"
          >
            <FormField
              control={form.control}
              name="textInput"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Ketik pesanmu di sini..."
                      className="min-h-[44px] resize-none focus-visible:ring-2 p-3 bg-secondary rounded-xl shadow-inner"
                      {...field}
                      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
               <Button
                type="submit"
                size="icon"
                className="h-11 w-11 bg-primary hover:bg-primary/90 rounded-full"
                disabled={form.formState.isSubmitting}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
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
                        <SelectTrigger className="w-auto sm:w-[150px] bg-secondary shadow-sm rounded-full h-11">
                          <SelectValue placeholder="Gaya" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Supportive">Suportif</SelectItem>
                        <SelectItem value="Neutral Objective">Netral</SelectItem>
                        <SelectItem value="Psychological">Psikologis</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground mb-1">Suara AI</label>
              <select
                className="rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={voiceGender}
                onChange={e => setVoiceGender(e.target.value as 'female' | 'male')}
              >
                <option value="female">Cewe (natural)</option>
                <option value="male">Cowo (natural)</option>
              </select>
            </div>
          </form>
        </Form>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
