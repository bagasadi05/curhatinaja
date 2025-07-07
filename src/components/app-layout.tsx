"use client";

import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DailyAffirmation } from "@/components/daily-affirmation";
import { EmotionJournal } from "@/components/emotion-journal";
import { PanicModal } from "@/components/panic-modal";
import { VoiceCall } from "@/components/voice-call";
import { FriendChat } from "@/components/friend-chat";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, BookHeart, Phone, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';


export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isJournalOpen, setIsJournalOpen] = React.useState(false);

  const handleEmotionLogged = (feelingLabel: string) => {
    setIsJournalOpen(false); // Close the dialog
    if (typeof (window as any).handleEmotionLogged === 'function') {
      (window as any).handleEmotionLogged(feelingLabel);
    }
  };

  const navItems = [
    {
      label: "Afirmasi",
      icon: Sparkles,
      dialog: (
        <Dialog>
          <DialogTrigger asChild>
             <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors w-full h-full">
                <Sparkles className="w-6 h-6" />
                <span className="text-xs font-medium">Afirmasi</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
            <DialogTitle className="sr-only">Afirmasi Harian</DialogTitle>
            <DailyAffirmation />
          </DialogContent>
        </Dialog>
      ),
    },
    {
      label: "Jurnal",
      icon: BookHeart,
      dialog: (
         <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors w-full h-full">
                <BookHeart className="w-6 h-6" />
                <span className="text-xs font-medium">Jurnal</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
            <DialogTitle className="sr-only">Jurnal Emosi</DialogTitle>
            <EmotionJournal onLog={handleEmotionLogged} />
          </DialogContent>
        </Dialog>
      ),
    },
     {
      label: "Diskusi",
      icon: Users,
      dialog: (
        <FriendChat>
           <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors w-full h-full">
                <Users className="w-6 h-6" />
                <span className="text-xs font-medium">Diskusi</span>
            </button>
        </FriendChat>
      ),
    },
    {
      label: "Telepon",
      icon: Phone,
      dialog: (
        <VoiceCall>
           <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors w-full h-full">
                <Phone className="w-6 h-6" />
                <span className="text-xs font-medium">Telepon</span>
            </button>
        </VoiceCall>
      ),
    },
     {
      label: "Cepat",
      icon: AlertCircle,
      dialog: (
        <PanicModal>
            <button className="flex flex-col items-center justify-center gap-1 text-destructive hover:text-destructive/80 transition-colors w-full h-full">
                <AlertCircle className="w-6 h-6" />
                <span className="text-xs font-medium">Cepat</span>
            </button>
        </PanicModal>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm shrink-0">
          <div className="text-left flex-1">
                <h1 className="text-xl font-poppins font-semibold text-foreground">
                CurhatinAja
              </h1>
              <p className="text-sm font-poppins text-muted-foreground -mt-1">Aku di sini untuk mendengarkan...</p>
          </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
         <div className="h-full w-full max-w-4xl mx-auto border-x border-border/50">
            {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm border-t">
        <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
            {navItems.map((item) => (
                <div key={item.label} className="flex items-center justify-center">
                    {item.dialog}
                </div>
            ))}
        </div>
      </nav>
    </div>
  );
}
