import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <div className="h-screen w-full bg-background">
      <main className="h-full w-full max-w-lg mx-auto border-x border-border">
        <ChatInterface />
      </main>
    </div>
  );
}
