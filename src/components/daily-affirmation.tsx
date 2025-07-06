"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote } from "lucide-react";

const affirmations = [
    "You are capable of amazing things.",
    "Your feelings are valid. Take your time.",
    "Every day is a new beginning. Take a deep breath and start again.",
    "You are stronger than you think.",
    "It's okay to not be okay. Kindness to yourself is key.",
    "You are enough, just as you are.",
    "Your potential is limitless.",
    "Believe in yourself and all that you are.",
];

export function DailyAffirmation() {
    const [affirmation, setAffirmation] = useState('');

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * affirmations.length);
        setAffirmation(affirmations[randomIndex]);
    }, []);

    return (
        <Card className="bg-accent/50 border-accent/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-headline text-stone-700">Daily Affirmation</CardTitle>
                <Quote className="h-5 w-5 text-accent-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground font-body italic">
                    {affirmation || "Loading your daily dose of positivity..."}
                </p>
            </CardContent>
        </Card>
    );
}
