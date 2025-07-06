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
      title: "Emotion Logged",
      description: `You've logged your current feeling. Keep reflecting!`,
    });
  };

  const getEmotionFeedback = (value: number) => {
    if (value < 33) return { icon: <Frown className="w-5 h-5 text-blue-500" />, label: "Feeling down" };
    if (value < 66) return { icon: <Meh className="w-5 h-5 text-yellow-500" />, label: "Feeling okay" };
    return { icon: <Smile className="w-5 h-5 text-green-500" />, label: "Feeling great" };
  }

  const {icon, label} = getEmotionFeedback(feeling);

  return (
    <Card className="bg-accent/50 border-accent/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-headline text-stone-700">Emotion Journal</CardTitle>
        <CardDescription className="text-sm">Track your feelings over time.</CardDescription>
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
          Log Today's Feeling
        </Button>
      </CardContent>
    </Card>
  );
}
