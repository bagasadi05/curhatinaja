"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Quote, Bell, BellOff } from "lucide-react";

const affirmations = [
    "Kamu mampu melakukan hal-hal luar biasa.",
    "Perasaanmu valid. Ambil waktumu.",
    "Setiap hari adalah awal yang baru. Tarik napas dalam-dalam dan mulai lagi.",
    "Kamu lebih kuat dari yang kamu kira.",
    "Tidak apa-apa untuk tidak baik-baik saja. Kebaikan pada diri sendiri adalah kuncinya.",
    "Kamu sudah cukup, apa adanya.",
    "Potensimu tidak terbatas.",
    "Percayalah pada dirimu sendiri dan semua yang ada padamu.",
];

const STORAGE_KEYS = {
    enabled: 'curhatinaja-affirmation-enabled',
    time: 'curhatinaja-affirmation-time',
};

let notificationTimeout: NodeJS.Timeout | null = null;

export function DailyAffirmation() {
    const [affirmation, setAffirmation] = useState('');
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationTime, setNotificationTime] = useState('08:00');
    const { toast } = useToast();

    const showNotification = useCallback(() => {
        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        new Notification('Afirmasi Harian Untukmu ✨', {
            body: randomAffirmation,
            icon: '/icons/icon-192x192.png',
            renotify: true,
            tag: 'daily-affirmation',
        });
    }, []);

    const scheduleNotification = useCallback((time: string) => {
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
        if (!notificationsEnabled || permission !== 'granted') {
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        let nextNotificationDate = new Date();
        nextNotificationDate.setHours(hours, minutes, 0, 0);

        if (nextNotificationDate <= now) {
            nextNotificationDate.setDate(nextNotificationDate.getDate() + 1);
        }

        const delay = nextNotificationDate.getTime() - now.getTime();

        notificationTimeout = setTimeout(() => {
            showNotification();
            scheduleNotification(time);
        }, delay);

    }, [notificationsEnabled, permission, showNotification]);

    useEffect(() => {
        if (!('Notification' in window)) {
            console.warn('Browser ini tidak mendukung notifikasi desktop.');
            return;
        }

        setPermission(Notification.permission);

        const savedEnabled = localStorage.getItem(STORAGE_KEYS.enabled) === 'true';
        const savedTime = localStorage.getItem(STORAGE_KEYS.time);

        setNotificationsEnabled(savedEnabled);
        if (savedTime) {
            setNotificationTime(savedTime);
        }
        
        if (savedEnabled && Notification.permission === 'granted') {
             scheduleNotification(savedTime || '08:00');
        }

        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        setAffirmation(randomAffirmation);

        return () => {
             if (notificationTimeout) {
                clearTimeout(notificationTimeout);
            }
        }
    }, [scheduleNotification]);


    const handleToggleNotifications = async () => {
        if (permission === 'denied') {
            toast({
                title: "Notifikasi Diblokir",
                description: "Harap izinkan notifikasi di pengaturan browser Anda.",
                variant: "destructive"
            });
            return;
        }

        if (notificationsEnabled) {
            localStorage.setItem(STORAGE_KEYS.enabled, 'false');
            setNotificationsEnabled(false);
            if (notificationTimeout) clearTimeout(notificationTimeout);
            toast({ title: "Notifikasi Afirmasi Dinonaktifkan" });
        } else {
            const currentPermission = await Notification.requestPermission();
            setPermission(currentPermission);

            if (currentPermission === 'granted') {
                localStorage.setItem(STORAGE_KEYS.enabled, 'true');
                setNotificationsEnabled(true);
                scheduleNotification(notificationTime);
                toast({
                    title: "Notifikasi Diaktifkan!",
                    description: `Anda akan menerima afirmasi setiap hari pukul ${notificationTime}.`
                });
            } else {
                toast({
                    title: "Izin Ditolak",
                    description: "Anda tidak akan menerima notifikasi.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setNotificationTime(newTime);
        localStorage.setItem(STORAGE_KEYS.time, newTime);
        if (notificationsEnabled) {
            scheduleNotification(newTime);
            toast({
                title: "Waktu Notifikasi Diperbarui",
                description: `Afirmasi sekarang akan dikirim pukul ${newTime}.`
            });
        }
    };

    return (
        <Card className="bg-secondary border-secondary/50 shadow-md">
            <CardHeader className="pb-4">
                <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-headline text-foreground">Afirmasi Harian</CardTitle>
                    <Quote className="h-5 w-5 text-primary" />
                </div>
                <CardDescription className="text-sm pt-2 text-muted-foreground font-sans italic">
                    {affirmation || "Memuat dosis positivitas harianmu..."}
                </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-4 pt-4 border-t border-border/50">
                <div className="w-full">
                    <h4 className="text-md font-headline mb-2 text-foreground">Pengingat Harian</h4>
                    <p className="text-xs text-muted-foreground mb-3">Dapatkan notifikasi afirmasi setiap hari pada waktu yang Anda tentukan.</p>
                    <div className="flex items-center gap-4">
                        <Input
                            type="time"
                            value={notificationTime}
                            onChange={handleTimeChange}
                            className="bg-background/50 w-32"
                            disabled={permission === 'denied'}
                        />
                        <Button
                            onClick={handleToggleNotifications}
                            variant={notificationsEnabled ? "outline" : "default"}
                            className="flex-1"
                            disabled={permission === 'denied'}
                        >
                            {notificationsEnabled ? <BellOff className="mr-2" /> : <Bell className="mr-2" />}
                            {notificationsEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                    </div>
                     {permission === 'denied' && (
                        <p className="text-xs text-destructive mt-2">
                            Anda telah memblokir notifikasi. Izinkan di pengaturan browser Anda untuk menggunakan fitur ini.
                        </p>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
