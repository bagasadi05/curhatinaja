"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateFriendChatAudio } from "@/ai/flows/generate-friend-chat-audio";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Play, Pause, LoaderCircle, AudioWaveform, Send, Sparkles, Voicemail } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(10, "Ceritakan lebih detail agar teman AI bisa membantumu.").max(300, "Cukup singkat saja ya, maksimal 300 karakter."),
  style: z.string().default("supportive"),
  voice: z.string().default("natural_female"),
});

type FriendChatResult = {
  script: string;
  audioUri: string;
};

export function FriendChat({ onClose }: { onClose: () => void }) {
  const [style, setStyle] = React.useState("supportive");
  const [voice, setVoice] = React.useState("natural_female");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<FriendChatResult | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      topic: "",
      style: "supportive",
      voice: "natural_female"
    },
  });

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Gagal memutar audio:", e));
    }
  };

  // Cleanup audio on component unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  React.useEffect(() => {
    if (result?.audioUri) {
        const audio = new Audio(result.audioUri);
        audioRef.current = audio;
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => setIsPlaying(false));
        
        return () => {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            audioRef.current = null;
        }
    }
  }, [result]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = { ...values, style, voice };
    setIsLoading(true);
    setResult(null);
    try {
      const chatResult = await generateFriendChatAudio(payload);
      setResult(chatResult);
    } catch (error) { 
      console.error("Gagal menghasilkan diskusi teman:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Maaf, teman-teman AI sedang sibuk. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6">
    {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <LoaderCircle className="w-12 h-12 text-primary animate-spin" />
            <p className="text-center text-muted-foreground">Teman-teman AI sedang berdiskusi...</p>
        </div>
    ) : result ? (
        <div className="h-full flex flex-col flex-1">
            <div className="mb-4">
                <h3 className="font-headline text-lg mb-2">Topik: {form.getValues('topic')}</h3>
                <div className="flex items-center gap-4 bg-secondary p-4 rounded-lg">
                    <Button size="icon" className="rounded-full h-12 w-12 flex-shrink-0" onClick={handlePlayPause}>
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <div className="flex-1">
                        <p className="font-semibold text-foreground">Dengarkan Percakapan</p>
                        <p className="text-sm text-muted-foreground">Tekan tombol untuk memutar</p>
                    </div>
                      <AudioWaveform className="w-10 h-10 text-primary/50" />
                </div>
            </div>
            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-4 font-sans text-sm sm:text-base whitespace-pre-wrap rounded-md bg-secondary/50 p-4 text-secondary-foreground">
                    {result.script.split('\n').map((line, index) => {
                      const parts = line.split(':');
                      const speaker = parts[0];
                      const dialogue = parts.slice(1).join(':');
                      const isAmi = speaker === 'Ami';
                      return (
                          <div key={index} className="flex gap-3 items-start">
                              <div className={cn("font-bold", isAmi ? "text-primary" : "text-chart-2")}>
                                  {speaker}:
                              </div>
                              <p className="flex-1 -mt-0.5">
                                  {dialogue.trim()}
                              </p>
                          </div>
                      );
                  })}
                </div>
            </ScrollArea>
            <div className="mt-auto pt-4">
              <Button variant="secondary" className="w-full" onClick={onClose}>Tutup</Button>
            </div>
        </div>
    ) : (
      <div className="h-full flex flex-col">
        {/* Header with AI settings */}
        <div className="flex items-center justify-between p-2 border-b border-white/10 mb-4">
            <h3 className="font-headline text-lg text-white">Diskusi AI</h3>
            <div className="flex items-center gap-2">
                <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="w-auto bg-transparent border-0 text-white focus:ring-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="supportive">Suportif</SelectItem>
                        <SelectItem value="reflective">Reflektif</SelectItem>
                        <SelectItem value="practical">Praktis</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="w-auto bg-transparent border-0 text-white focus:ring-0">
                        <Voicemail className="w-5 h-5 text-primary" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="natural_female">Cewe (Natural)</SelectItem>
                        <SelectItem value="calm_male">Cowo (Tenang)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <AudioWaveform className="w-12 h-12 text-primary" />
            </div>
            <h4 className="font-headline text-xl text-white">Mulai Percakapan</h4>
            <p className="text-white/70 text-sm max-w-xs">
                Ceritakan apa saja yang ada di pikiranmu. Teman AI di sini untuk mendengarkan tanpa menghakimi.
            </p>
        </div>

        {/* Chat Input Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-2 space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                        <Textarea
                          placeholder="Ketik pesanmu di sini..."
                          className="resize-none bg-white/10 border-white/20 text-white rounded-2xl pr-12 py-3"
                          rows={1}
                          {...field}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !field.value} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full">
                            {isLoading ? <LoaderCircle className="animate-spin" /> : <Send className="w-5 h-5"/>}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    )}
    </div>
  );
}
