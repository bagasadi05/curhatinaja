"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateResponse } from "@/ai/flows/generate-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { cn } from "@/lib/utils";

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

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    if (!url || !audioRef.current) return;

    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.play();
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

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-primary/20">
      <div className="flex-1 flex flex-col gap-4">
        <header className="text-center">
            <h2 className="text-2xl md:text-3xl font-headline text-stone-800">Bagaimana perasaanmu hari ini?</h2>
            <p className="text-muted-foreground">Bagikan pemikiranmu dan mari kita bicarakan.</p>
        </header>
        <ScrollArea className="flex-1 -mx-4" ref={scrollAreaRef}>
          <div className="px-4 space-y-6 py-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                    <ChibiIcon className="w-32 h-32 text-accent/80" />
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
                  <Avatar className="h-9 w-9 border-2 border-accent">
                    <div className="bg-accent/50 w-full h-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={cn(
                    "max-w-md rounded-2xl shadow-sm",
                    message.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-none"
                      : "bg-white text-foreground rounded-bl-none"
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
                                className="h-7 w-7 shrink-0 text-foreground/60 hover:bg-black/5 hover:text-foreground"
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
                  <Avatar className="h-9 w-9 border-2 border-accent">
                     <div className="bg-accent/50 w-full h-full flex items-center justify-center">
                        <User className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <AvatarFallback>Anda</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="mt-auto pt-4">
        <Card className="rounded-xl shadow-lg">
          <CardContent className="p-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-start gap-2"
              >
                <FormField
                  control={form.control}
                  name="textInput"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Ketik pesanmu di sini..."
                          className="h-24 resize-none border-0 focus-visible:ring-0 shadow-none p-3"
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
                <div className="flex flex-col gap-2 p-1">
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
                            <SelectTrigger className="w-[150px]">
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
                    size="lg"
                    className="h-full bg-accent hover:bg-accent/80"
                    disabled={form.formState.isSubmitting}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
