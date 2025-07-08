
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
    <div className="w-full max-w-xl mx-auto">
      <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl border border-primary/30 p-6 md:p-10 space-y-10">
        {/* Overlay gelap dihapus, karena background sudah gelap */}
        <div className="relative flex flex-col items-center gap-2 z-10">
          <h2 className="font-headline text-4xl md:text-5xl text-white drop-shadow-lg mb-2" style={{textShadow: '0 2px 8px #0008'}}>Jurnal Emosi</h2>
          <p className="text-lg text-blue-200 font-semibold mb-4" style={{textShadow: '0 1px 4px #0008'}}>Catat perasaanmu & lihat perjalanan emosimu 🌈</p>
          <div className="flex items-center gap-3 bg-gray-800/80 rounded-xl px-4 py-2 shadow border border-orange-400 mb-6">
            <span className="text-orange-400 text-xl">🔥</span>
            <span className="font-bold text-orange-200">{streak}</span>
            <span className="text-sm text-orange-300">hari berturut-turut</span>
          </div>
        </div>
        {/* Emoji Picker */}
        <div className="relative flex items-center justify-center gap-4 mb-8 z-10">
          {feelingLevels.map((feeling) => (
            <button
              key={feeling.level}
              type="button"
              title={feeling.label}
              aria-label={feeling.label}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-lg border-2 border-white/30 bg-gray-700/90 hover:scale-110 transition-all duration-200",
                selectedFeeling?.level === feeling.level ? "ring-4 ring-primary/60 scale-110" : ""
              )}
              onClick={() => setSelectedFeeling(feeling)}
              disabled={hasLoggedToday}
            >
              {feeling.emoji}
            </button>
          ))}
        </div>
        {/* Button log emosi */}
        <button
          className={cn(
            "w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 text-white shadow-lg transition-all duration-200 mb-8",
            hasLoggedToday && "opacity-60 bg-gray-600 text-gray-300 cursor-not-allowed"
          )}
          onClick={handleLogEmotion}
          disabled={hasLoggedToday}
        >
          {hasLoggedToday ? "Perasaan Hari Ini Sudah Dicatat" : "Catat Perasaan Hari Ini"}
        </button>
        {/* Chart */}
        <div className="relative z-10 mb-6">
          <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary"/>Tren Emosi 7 Hari</h3>
          {logs.length > 0 ? (
              <div className="h-[180px] w-full animate-fade-in">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                          <XAxis dataKey="name" stroke="#a78bfa" fontSize={14} tickLine={false} axisLine={false} />
                          <YAxis stroke="#a78bfa" fontSize={14} tickLine={false} axisLine={false} domain={[0, 6]} tickCount={6} tick={<CustomYAxisTick />} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3e8ff' }} />
                          <Bar dataKey="feeling" radius={[8, 8, 0, 0]} fill="#a78bfa" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          ) : (
              <div className="text-center text-muted-foreground py-6 animate-fade-in">Belum ada data tren emosi.</div>
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
