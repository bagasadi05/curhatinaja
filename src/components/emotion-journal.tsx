"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smile, Frown, Meh } from "lucide-react";

export function EmotionJournal() {
  const [feeling, setFeeling] = useState(50);
  const { toast } = useToast();

  const handleLogEmotion = () => {
    toast({
      title: "Emosi Dicatat",
      description: `Kamu telah mencatat perasaanmu saat ini. Teruslah berefleksi!`,
    });
  };

  const getEmotionFeedback = (value: number) => {
    if (value < 33) return { icon: <Frown className="w-5 h-5 text-blue-400" />, label: "Merasa sedih" };
    if (value < 66) return { icon: <Meh className="w-5 h-5 text-yellow-400" />, label: "Merasa biasa saja" };
    return { icon: <Smile className="w-5 h-5 text-green-400" />, label: "Merasa baik" };
  }

  const {icon, label} = getEmotionFeedback(feeling);

  return (
    <Card className="bg-accent/50 border-accent/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-headline text-foreground">Jurnal Emosi</CardTitle>
        <CardDescription className="text-sm">Lacak perasaanmu dari waktu ke waktu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">{icon}</div>
            <Slider
              defaultValue={[feeling]}
              max={100}
              step={1}
              onValueChange={(value) => setFeeling(value[0])}
              className="flex-grow"
            />
        </div>
        <p className="text-center text-sm font-medium text-muted-foreground">{label}</p>
        <Button onClick={handleLogEmotion} className="w-full bg-accent hover:bg-accent/80 text-accent-foreground">
          Catat Perasaan Hari Ini
        </Button>
      </CardContent>
    </Card>
  );
}
