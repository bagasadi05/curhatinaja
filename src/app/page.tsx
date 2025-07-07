import { DailyAffirmation } from "@/components/daily-affirmation";
import { EmotionJournal } from "@/components/emotion-journal";
import { ChibiIcon } from "@/components/icons";
import { PanicModal } from "@/components/panic-modal";
import { ChatInterface } from "@/components/chat-interface";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-background">
      <div className="flex h-full min-h-screen">
        <aside className="hidden md:flex flex-col w-[320px] p-6 bg-primary/40 border-r border-primary/20">
          <header className="flex flex-col items-center text-center gap-4 mb-8">
            <ChibiIcon className="w-24 h-24 text-stone-700" />
            <h1 className="font-headline text-3xl text-stone-800">
              CurhatinAja
            </h1>
            <p className="text-sm text-stone-600">
             Ruang aman untuk berbagi perasaan dan pikiranmu tanpa dihakimi.
            </p>
          </header>

          <div className="flex flex-col gap-6 flex-grow">
            <DailyAffirmation />
            <EmotionJournal />
          </div>

          <footer className="mt-auto">
            <PanicModal />
          </footer>
        </aside>

        <main className="flex-1 h-screen flex flex-col">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}
