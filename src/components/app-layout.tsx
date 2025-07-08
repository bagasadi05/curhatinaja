"use client";

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DailyAffirmation } from "@/components/daily-affirmation";
import { EmotionJournal } from "@/components/emotion-journal";
import { PanicModal } from "@/components/panic-modal";
import { VoiceCall } from "@/components/voice-call";
import { FriendChat } from "@/components/friend-chat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, BookHeart, Phone, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';


export function AppLayout({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<string | null>(null);



  const handleEmotionLogged = (feelingLabel: string) => {
    setActiveView(null); // Close the dialog
    if (typeof (window as { handleEmotionLogged?: (feelingLabel: string) => void }).handleEmotionLogged === 'function') {
      (window as { handleEmotionLogged?: (feelingLabel: string) => void }).handleEmotionLogged!(feelingLabel);
    }
  };

  const navItems = [
    { label: "Afirmasi", icon: Sparkles, component: DailyAffirmation },
    { label: "Jurnal", icon: BookHeart, component: EmotionJournal },
    { label: "Diskusi", icon: Users, component: FriendChat },
    { label: "Telepon", icon: Phone, component: VoiceCall },
    { label: "Cepat", icon: AlertCircle, component: PanicModal },
  ];

  const activeNavItem = navItems.find(item => item.label === activeView);
  const ActiveComponent = activeNavItem?.component;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center justify-center w-full relative">
          {activeView ? (
            <button onClick={() => setActiveView(null)} className="absolute left-0 p-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="absolute left-0 text-left">
              <h1 className="text-lg md:text-xl font-poppins font-semibold text-foreground">
                CurhatinAja
              </h1>
              <p className="text-sm font-poppins text-muted-foreground -mt-1">Aku di sini untuk mendengarkan...</p>
            </div>
          )}
          <h2 className="text-lg font-semibold font-poppins">
            {activeNavItem?.label}
          </h2>
          <div className="absolute right-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className={cn("h-full w-full md:max-w-4xl md:mx-auto md:border-x md:border-border/50", activeView && "pb-0")}>
          {children}
        </div>
      </main>

      <Dialog open={!!activeView} onOpenChange={(isOpen) => !isOpen && setActiveView(null)}>
        <DialogContent className="w-screen h-[calc(100vh-4rem)] mt-16 max-w-none rounded-none p-0 border-0 shadow-none bg-background">
          <DialogHeader className="sr-only">
            <DialogTitle>{activeView}</DialogTitle>
            <DialogDescription>
              {activeView === 'Afirmasi' && "Log your current affirmation."}
              {activeView === 'Jurnal' && "View your emotion journal."}
              {activeView === 'Diskusi' && "Chat with friends."}
              {activeView === 'Telepon' && "Make a voice call."}
              {activeView === 'Cepat' && "Quick access to panic modal."}
            </DialogDescription>
          </DialogHeader>
          {ActiveComponent && (
            <ActiveComponent 
              onClose={() => setActiveView(null)} 
              onLog={handleEmotionLogged} 
            />
          )}
        </DialogContent>
      </Dialog>

      <nav className={cn("fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/90 backdrop-blur-md border-t shadow-lg transition-transform duration-300", activeView && "translate-y-full")}>
        <div className="grid h-full grid-cols-5 max-w-lg mx-auto px-4 gap-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveView(item.label)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors w-full h-full",
                activeView === item.label && "text-primary"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
