"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote } from "lucide-react";

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

export function DailyAffirmation() {
    const [affirmation, setAffirmation] = useState('');

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * affirmations.length);
        setAffirmation(affirmations[randomIndex]);
    }, []);

    return (
        <Card className="bg-secondary border-secondary/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-headline text-foreground">Afirmasi Harian</CardTitle>
                <Quote className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground font-sans italic">
                    {affirmation || "Memuat dosis positivitas harianmu..."}
                </p>
            </CardContent>
        </Card>
    );
}
