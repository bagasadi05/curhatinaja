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
import { AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  userInput: z.string().min(10, "Tolong jelaskan lebih lanjut apa yang sedang terjadi."),
});

export function PanicModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userInput: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResponse(null);
    try {
      const result = await provideUrgentSupport(values);
      setResponse(result.comfortingResponse);
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
        
        {response ? (
          <Alert variant="default" className="bg-primary/20 border-primary/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-headline">Pikiran yang Menenangkan</AlertTitle>
            <AlertDescription className="font-sans">{response}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[220px]" />
          </div>
        ) : (
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
      </DialogContent>
    </Dialog>
  );
}
