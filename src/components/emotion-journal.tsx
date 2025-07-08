
"use client";

import { useState, useEffect } from "react";
import { format, subDays, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { BarChart3 } from "lucide-react";
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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

interface CustomYAxisTickProps {
  y?: number;
  payload?: { value: number };
}
const CustomYAxisTick = ({ y, payload }: CustomYAxisTickProps) => {
    const feeling = feelingLevels.find(l => l.level === payload?.value);
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
  onLog: (feelingLabel: string) => void;
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
        onLog(selectedFeeling.label);
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
    <div className="h-full w-full bg-gradient-to-br from-gray-900 via-purple-900/90 to-blue-900/80">
      <div className="h-full w-full overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col">
        <div className="relative flex flex-col items-center text-center z-10 mb-8">
          <h2 className="font-headline text-3xl md:text-4xl text-white font-bold drop-shadow-lg mb-2">Bagaimana Perasaanmu Hari Ini?</h2>
          <p className="text-base text-blue-200/90 mb-6">Pilih satu emoji yang paling mewakili perasaanmu.</p>
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 shadow-inner border border-white/20">
            <span className="text-lg">🔥</span>
            <span className="font-bold text-white text-sm">{streak} Hari Beruntun</span>
          </div>
        </div>
        {/* Emoji Picker */}
        <div className="relative grid grid-cols-5 gap-3 sm:gap-4 mb-8 z-10">
          {feelingLevels.map((feeling) => (
            <button
              key={feeling.level}
              type="button"
              title={feeling.label}
              aria-label={feeling.label}
              className={cn(
                "aspect-square rounded-2xl flex flex-col items-center justify-center text-3xl md:text-4xl shadow-lg border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 transform hover:-translate-y-1",
                selectedFeeling?.level === feeling.level ? "ring-2 ring-primary bg-primary/20 scale-105" : "hover:border-white/30",
                hasLoggedToday && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => setSelectedFeeling(feeling)}
              disabled={hasLoggedToday}
            >
              <span className="mb-1">{feeling.emoji}</span>
              <span className="text-xs font-medium text-white/80">{feeling.label}</span>
            </button>
          ))}
        </div>
        {/* Button log emosi */}
        <button
          className={cn(
            "w-full py-3 rounded-xl font-bold text-base sm:text-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 mb-8 disabled:opacity-50 disabled:cursor-not-allowed",
            !selectedFeeling && !hasLoggedToday && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleLogEmotion}
          disabled={hasLoggedToday}
        >
          {hasLoggedToday ? "Perasaan Hari Ini Sudah Dicatat" : "Catat Perasaan Hari Ini"}
        </button>
        {/* Chart */}
        <div className="relative z-10 mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary"/>Tren Emosi 7 Hari Terakhir</h3>
          {logs.length > 0 ? (
              <div className="h-[160px] sm:h-[180px] w-full animate-fade-in">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFeeling" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(0, 0%, 100%, 0.1)" />
                          <XAxis dataKey="name" stroke="hsla(0, 0%, 100%, 0.5)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsla(0, 0%, 100%, 0.5)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} tickCount={6} tick={<CustomYAxisTick />} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(0, 0%, 100%, 0.1)' }} />
                          <Bar dataKey="feeling" radius={[4, 4, 0, 0]} fill="url(#colorFeeling)" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          ) : (
              <div className="text-center text-white/60 py-10 animate-fade-in">Mulai catat perasaanmu untuk melihat tren emosi di sini.</div>
          )}
        </div>
        {/* Empty state jika belum ada log */}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-blue-100 space-y-2 z-10">
            <span className="text-6xl mb-2">🌤️</span>
            <p className="font-semibold text-lg">Belum ada catatan emosi</p>
            <p className="text-sm">Mulai catat perasaanmu hari ini untuk melihat tren emosimu di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
