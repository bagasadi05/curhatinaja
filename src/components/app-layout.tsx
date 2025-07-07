"use client";

import React from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ChibiIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { DailyAffirmation } from "@/components/daily-affirmation";
import { EmotionJournal } from "@/components/emotion-journal";
import { PanicModal } from "@/components/panic-modal";
import { VoiceCall } from "@/components/voice-call";
import { FriendChat } from "@/components/friend-chat";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, BookHeart, Phone, Sparkles, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';


export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isJournalOpen, setIsJournalOpen] = React.useState(false);

  const handleEmotionLogged = (feelingLabel: string) => {
    setIsJournalOpen(false); // Close the dialog
    if (typeof (window as any).handleEmotionLogged === 'function') {
      (window as any).handleEmotionLogged(feelingLabel);
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        variant="sidebar"
        collapsible={isMobile ? 'offcanvas' : 'icon'}
      >
        <SidebarHeader>
          <Button variant="ghost" className="h-10 w-full justify-start px-2">
            <ChibiIcon className="w-7 h-7 text-primary" />
            <span className="font-poppins font-semibold text-base ml-2">
              CurhatinAja
            </span>
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <SidebarMenuButton tooltip="Afirmasi Harian">
                        <Sparkles />
                        <span>Afirmasi Harian</span>
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
                    <DialogTitle className="sr-only">Afirmasi Harian</DialogTitle>
                    <DailyAffirmation />
                  </DialogContent>
                </Dialog>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
                  <DialogTrigger asChild>
                     <SidebarMenuButton tooltip="Jurnal Emosi">
                        <BookHeart />
                        <span>Jurnal Emosi</span>
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
                    <DialogTitle className="sr-only">Jurnal Emosi</DialogTitle>
                    <EmotionJournal onLog={handleEmotionLogged} />
                  </DialogContent>
                </Dialog>
            </SidebarMenuItem>
            <SidebarSeparator />
            <SidebarMenuItem>
                <FriendChat>
                    <SidebarMenuButton tooltip="Diskusi Teman AI">
                        <Users />
                        <span>Diskusi Teman AI</span>
                    </SidebarMenuButton>
                </FriendChat>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <VoiceCall>
                    <SidebarMenuButton tooltip="Mode Telepon">
                        <Phone />
                        <span>Mode Telepon</span>
                    </SidebarMenuButton>
                </VoiceCall>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <PanicModal>
                         <SidebarMenuButton tooltip="Dukungan Cepat" className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:text-destructive">
                            <AlertCircle />
                            <span>Dukungan Cepat</span>
                        </SidebarMenuButton>
                    </PanicModal>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <div className="flex items-center justify-between w-full p-2">
                        <span className="text-sm font-medium ml-2 group-data-[collapsible=icon]:hidden">
                            Mode Tampilan
                        </span>
                        <ThemeToggle />
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm md:hidden">
            <div className="text-center flex-1">
                 <h2 className="text-xl font-poppins font-semibold text-foreground">
                    CurhatinAja
                </h2>
                <p className="text-sm font-poppins text-muted-foreground -mt-1">Aku di sini untuk mendengarkan...</p>
            </div>
          <SidebarTrigger />
        </header>
        <main className="h-[calc(100vh-3.5rem)] md:h-screen w-full max-w-4xl mx-auto border-x border-border/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
