
"use client";

import { useState, useEffect } from "react";
import { format, subDays, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Flame } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

type EmotionLevel = {
  level: number;
  label: string;
  emoji: string;
  color: string;
};

const feelingLevels: EmotionLevel[] = [
  { level: 1, emoji: '😭', label: 'Sangat Sedih', color: 'hsl(var(--chart-5))' },
  { level: 2, emoji: '😔', label: 'Sedih', color: 'hsl(var(--chart-4))' },
  { level: 3, emoji: '😐', label: 'Biasa Saja', color: 'hsl(var(--chart-3))' },
  { level: 4, emoji: '😊', label: 'Senang', color: 'hsl(var(--chart-2))' },
  { level: 5, emoji: '😁', label: 'Sangat Senang', color: 'hsl(var(--chart-1))' },
];

type EmotionLog = {
  date: string; // ISO 8601 string
  feeling: EmotionLevel;
};

type JournalData = {
    logs: EmotionLog[];
    streak: number;
    lastLogDate: string | null;
}

const STORAGE_KEY = "curhatinaja-emotion-journal";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const roundedLevel = Math.round(value);
      const feeling = feelingLevels.find(f => f.level === roundedLevel);
      
      return (
        <div className="p-2 bg-secondary text-secondary-foreground rounded-lg shadow-lg border border-border/50">
          <p className="font-bold">{`Tanggal: ${label}`}</p>
          {feeling ? (
             <p className="text-sm">{`Rata-rata: ${feeling.label}`}</p>
          ) : (
             <p className="text-sm">Tidak ada data</p>
          )}
        </div>
      );
    }
    return null;
};

const CustomYAxisTick = ({ y, payload }: any) => {
    const feeling = feelingLevels.find(l => l.level === payload.value);
    if (feeling) {
      return (
        <g transform={`translate(-10, ${y})`}>
          <text x={0} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={16}>
            {feeling.emoji}
          </text>
        </g>
      );
    }
    return null;
};


type EmotionJournalProps = {
  onLog?: (feelingLabel: string) => void;
};

export function EmotionJournal({ onLog }: EmotionJournalProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<EmotionLevel | null>(null);
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();
  
  const hasLoggedToday = logs.some(log => isToday(new Date(log.date)));

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: JournalData = JSON.parse(storedData);
        setLogs(data.logs || []);

        if (data.lastLogDate) {
            const lastDate = new Date(data.lastLogDate);
            if (isToday(lastDate) || isYesterday(lastDate)) {
                setStreak(data.streak);
            } else {
                setStreak(0);
            }
        }
      }
    } catch (error) {
        console.error("Gagal memuat data jurnal:", error)
        localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleLogEmotion = () => {
    if (!selectedFeeling) {
        toast({
            title: "Pilih Perasaanmu",
            description: "Silakan pilih salah satu emoji untuk mencatat perasaanmu.",
            variant: "destructive"
        })
        return;
    }

    const today = new Date();
    const newLog: EmotionLog = {
      date: today.toISOString(),
      feeling: selectedFeeling,
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

    if (!hasLoggedToday) {
       if (lastLogDate && isYesterday(lastLogDate)) {
            currentStreak++;
        } else if (!lastLogDate || !isToday(lastLogDate)) {
            currentStreak = 1;
        }
    }
    
    const updatedLogs = [...logs.filter(log => format(new Date(log.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')), newLog];
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
        onLog?.(selectedFeeling.label);
      } catch (error) {
        console.error("Gagal menyimpan log emosi:", error);
        toast({
            title: "Gagal Menyimpan",
            description: "Tidak dapat menyimpan catatan emosimu saat ini.",
            variant: "destructive"
        })
    }
  };

  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
  const chartData = last7Days.map(date => {
    const dayLog = logs.find(log => format(new Date(log.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    return {
      name: format(date, "EEE", { locale: id }),
      feeling: dayLog ? dayLog.feeling.level : 0,
      fill: dayLog ? dayLog.feeling.color : 'transparent'
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
          <h3 className="text-sm font-medium mb-4 text-center text-muted-foreground">Bagaimana perasaanmu hari ini?</h3>
          <div className="flex items-center justify-around gap-2">
            {feelingLevels.map((feeling) => (
                <button 
                    key={feeling.level}
                    onClick={() => setSelectedFeeling(feeling)}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 w-14 h-14 justify-center",
                        selectedFeeling?.level === feeling.level ? 'bg-primary/20 scale-110' : 'opacity-60 hover:opacity-100 hover:bg-primary/10',
                    )}
                    aria-label={feeling.label}
                >
                    <span className="text-2xl">{feeling.emoji}</span>
                </button>
            ))}
          </div>
           {selectedFeeling && <p className="text-center text-sm font-medium text-primary mt-4">{selectedFeeling.label}</p>}
        </div>
        
        <Button onClick={handleLogEmotion} className="w-full bg-primary hover:bg-primary/80 text-primary-foreground" disabled={hasLoggedToday}>
          {hasLoggedToday ? "Perasaan Hari Ini Sudah Dicatat" : "Catat Perasaan"}
        </Button>

        <div className="pt-4 border-t border-border/50">
            <h3 className="text-md font-headline mb-2 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary"/>Tren Emosi 7 Hari</h3>
            {logs.length > 0 ? (
                <div className="h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 6]} tickCount={6} tick={<CustomYAxisTick />} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--accent), 0.5)' }} />
                            <Bar dataKey="feeling" radius={[4, 4, 0, 0]} />
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
