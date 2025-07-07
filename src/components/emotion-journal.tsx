
"use client";

import { useState, useEffect } from "react";
import { format, subDays, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smile, Frown, Meh, BarChart3, Flame } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

type EmotionLog = {
  date: string; // ISO 8601 string
  feeling: number;
};

type JournalData = {
    logs: EmotionLog[];
    streak: number;
    lastLogDate: string | null;
}

const STORAGE_KEY = "curhatinaja-emotion-journal";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-secondary text-secondary-foreground rounded-lg shadow-lg">
          <p className="font-bold">{`Tanggal: ${label}`}</p>
          <p className="text-sm">{`Perasaan: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

export function EmotionJournal() {
  const [feeling, setFeeling] = useState(50);
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: JournalData = JSON.parse(storedData);
        setLogs(data.logs || []);

        // Calculate streak
        if (data.lastLogDate) {
            const lastDate = new Date(data.lastLogDate);
            if (isToday(lastDate) || isYesterday(lastDate)) {
                setStreak(data.streak);
            } else {
                setStreak(0); // Streak is broken
            }
        }
      }
    } catch (error) {
        console.error("Gagal memuat data jurnal:", error)
        localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleLogEmotion = () => {
    const today = new Date();
    const newLog: EmotionLog = {
      date: today.toISOString(),
      feeling: feeling,
    };

    let currentStreak = streak;
    let lastLogDate: Date | null = null;
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const data: JournalData = JSON.parse(storedData);
            if (data.lastLogDate) {
                lastLogDate = new Date(data.lastLogDate);
            }
        }
    } catch (error) {
        console.error("Gagal membaca data untuk memperbarui rentetan:", error);
    }

    if (lastLogDate && isYesterday(lastLogDate)) {
        currentStreak++;
    } else if (!lastLogDate || !isToday(lastLogDate)) {
        // If they haven't logged today yet, or ever
        currentStreak = 1;
    }
    // If they already logged today, streak doesn't change.

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    setStreak(currentStreak);

    try {
        const dataToStore: JournalData = {
            logs: updatedLogs,
            streak: currentStreak,
            lastLogDate: today.toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
        toast({
          title: "Emosi Dicatat!",
          description: `Rentetanmu sekarang ${currentStreak} hari. Teruslah berefleksi!`,
        });
    } catch (error) {
        console.error("Gagal menyimpan log emosi:", error);
        toast({
            title: "Gagal Menyimpan",
            description: "Tidak dapat menyimpan catatan emosimu saat ini.",
            variant: "destructive"
        })
    }
  };

  const getEmotionFeedback = (value: number) => {
    if (value < 33) return { icon: <Frown className="w-5 h-5 text-blue-400" />, label: "Merasa sedih" };
    if (value < 66) return { icon: <Meh className="w-5 h-5 text-yellow-400" />, label: "Merasa biasa saja" };
    return { icon: <Smile className="w-5 h-5 text-green-400" />, label: "Merasa baik" };
  };

  const { icon, label } = getEmotionFeedback(feeling);

  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
  const chartData = last7Days.map(date => {
    const dayLogs = logs.filter(log => format(new Date(log.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    const averageFeeling = dayLogs.length > 0 ? dayLogs.reduce((acc, curr) => acc + curr.feeling, 0) / dayLogs.length : 0;
    return {
      name: format(date, "EEE", { locale: id }),
      feeling: averageFeeling,
    };
  });

  return (
    <Card className="bg-secondary border-secondary/50 shadow-md w-full">
      <CardHeader>
        <CardTitle className="text-lg font-headline text-foreground">Jurnal Emosi</CardTitle>
        <CardDescription className="text-sm">Catat perasaanmu dan lihat tren emosimu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
            <Flame className="w-5 h-5 text-orange-400" />
            <p>Rentetan <strong>{streak}</strong> hari</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2 text-center text-muted-foreground">Bagaimana perasaanmu hari ini?</h3>
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
          <p className="text-center text-sm font-medium text-muted-foreground mt-2">{label}</p>
        </div>
        
        <Button onClick={handleLogEmotion} className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
          Catat Perasaan Hari Ini
        </Button>

        <div className="pt-4 border-t border-border/50">
            <h3 className="text-md font-headline mb-2 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary"/>Tren Emosi 7 Hari</h3>
            {logs.length > 0 ? (
                <div className="h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--accent), 0.5)' }} />
                            <Bar dataKey="feeling" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-10">Belum ada data. Mulai catat perasaanmu untuk melihat tren.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

