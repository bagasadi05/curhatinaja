"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { provideUrgentSupport } from "@/ai/flows/provide-urgent-support";

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
import { AlertCircle, Zap, Wind } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  userInput: z.string().min(10, "Tolong jelaskan lebih lanjut apa yang sedang terjadi."),
});

function BreathingExercise() {
  const [text, setText] = React.useState("Tarik napas");
  const timerRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    const sequence = [
      { text: "Tarik napas...", duration: 4000 },
      { text: "Tahan...", duration: 2000 },
      { text: "Hembuskan...", duration: 6000 },
    ];
    let currentIndex = 0;

    const cycle = () => {
      setText(sequence[currentIndex].text);
      const nextIndex = (currentIndex + 1) % sequence.length;
      timerRef.current = setTimeout(() => {
        currentIndex = nextIndex;
        cycle();
      }, sequence[currentIndex].duration);
    };
    
    cycle();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <h3 className="text-lg font-headline flex items-center gap-2"><Wind className="w-5 h-5 text-primary" /> Latihan Pernapasan</h3>
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-breathing-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <p className="text-lg font-medium text-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}


export function PanicModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);
  const [showBreathing, setShowBreathing] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userInput: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResponse(null);
    setShowBreathing(false);
    try {
      const result = await provideUrgentSupport(values);
      setResponse(result.comfortingResponse);
      setShowBreathing(true);
    } catch (error) {
      console.error("Error providing urgent support:", error);
      setResponse("Saya mengalami sedikit masalah saat menyambung. Ingatlah untuk bernapas dalam-dalam. Kamu aman.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setResponse(null);
      setIsLoading(false);
      setShowBreathing(false);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-background">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Dukungan Cepat
          </DialogTitle>
          <DialogDescription>
            Kamu tidak sendiri. Tarik napas dalam-dalam. Mari kita lewati ini bersama.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}

          {response && !isLoading && (
            <Alert variant="default" className="bg-primary/10 border-primary/20 mb-4">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="font-headline text-primary">Pikiran yang Menenangkan</AlertTitle>
              <AlertDescription className="font-sans text-foreground/90">{response}</AlertDescription>
            </Alert>
          )}

          {showBreathing && !isLoading && (
            <BreathingExercise />
          )}

          {!response && !isLoading && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Ceritakan apa yang ada di pikiranmu. Di sini aman."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/80 text-primary-foreground">
                    Dapatkan Ketenangan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {(response || isLoading) && (
             <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => handleOpenChange(false)}>Tutup</Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
