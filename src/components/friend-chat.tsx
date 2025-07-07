"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateFriendChatAudio } from "@/ai/flows/generate-friend-chat-audio";
import { cn } from "@/lib/utils";

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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Users, Play, Pause, LoaderCircle, AudioWaveform } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  topic: z.string().min(10, "Ceritakan lebih detail agar teman AI bisa membantumu.").max(300, "Cukup singkat saja ya, maksimal 300 karakter."),
});

type FriendChatResult = {
  script: string;
  audioUri: string;
};

export function FriendChat({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<FriendChatResult | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Gagal memutar audio:", e));
    }
  };
  
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
    setIsLoading(true);
    setResult(null);
    try {
      const chatResult = await generateFriendChatAudio(values);
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setResult(null);
      setIsLoading(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl h-[85vh] flex flex-col p-0 bg-background">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="font-headline text-2xl flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            Diskusi Teman AI
          </DialogTitle>
          <DialogDescription>
            Dengarkan dua perspektif dari teman AI-mu, Ami yang empatik dan Budi yang praktis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
        {isLoading ? (
            <div className="p-6 space-y-4">
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-center pt-8">
                    <LoaderCircle className="w-12 h-12 text-primary animate-spin" />
                </div>
                <p className="text-center text-muted-foreground">Teman-teman AI sedang berdiskusi...</p>
            </div>
        ) : result ? (
            <div className="h-full flex flex-col">
                <div className="p-6">
                    <h3 className="font-headline text-lg mb-2">Topik: {form.getValues('topic')}</h3>
                    <div className="flex items-center gap-4 bg-secondary p-4 rounded-lg">
                        <Button size="icon" className="rounded-full h-12 w-12" onClick={handlePlayPause}>
                            {isPlaying ? <Pause /> : <Play />}
                        </Button>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">Dengarkan Percakapan</p>
                            <p className="text-sm text-muted-foreground">Tekan tombol untuk memutar</p>
                        </div>
                         <AudioWaveform className="w-10 h-10 text-primary/50" />
                    </div>
                </div>
                <ScrollArea className="flex-1 px-6 pb-6">
                    <div className="space-y-4 font-sans whitespace-pre-wrap rounded-md bg-secondary/50 p-4 text-secondary-foreground">
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
            </div>
        ) : (
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Ceritakan apa yang sedang kamu rasakan atau pikirkan..."
                          className="resize-none bg-secondary/50"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="animate-spin" /> : "Mulai Diskusi"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
