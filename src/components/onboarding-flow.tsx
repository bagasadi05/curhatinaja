"use client";

import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChibiIcon } from "@/components/icons";
import { ShieldCheck, MessageCircle, Mic, BarChart3, ArrowRight } from "lucide-react";

type OnboardingFlowProps = {
  onComplete: () => void;
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const slides = [
    {
      icon: <ChibiIcon className="w-32 h-32 text-primary" />,
      title: "Selamat Datang di CurhatinAja",
      description: "Ruang amanmu untuk berbagi cerita, berefleksi, dan menemukan ketenangan. Kamu tidak sendirian.",
    },
    {
      icon: <ShieldCheck className="w-32 h-32 text-primary" />,
      title: "Privasimu Adalah Segalanya",
      description: "Semua percakapanmu bersifat pribadi dan hanya untukmu. Kami tidak pernah menyimpan atau membagikan ceritamu.",
    },
    {
      icon: (
        <div className="flex gap-8 text-primary">
          <MessageCircle className="w-16 h-16" />
          <BarChart3 className="w-16 h-16" />
          <Mic className="w-16 h-16" />
        </div>
      ),
      title: "Temukan Cara yang Tepat Untukmu",
      description: "Baik melalui obrolan teks, mencatat emosi harian, atau berbicara langsung, kami di sini untuk mendengarkan.",
    },
  ];

  const handleNext = () => {
    if (current < slides.length - 1) {
      api?.scrollNext();
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col justify-center items-center p-4 animate-in fade-in-50">
      <Carousel setApi={setApi} className="w-full max-w-md">
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="bg-secondary border-none shadow-xl">
                  <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-6 min-h-[400px]">
                    {slide.icon}
                    <h2 className="text-2xl font-headline text-foreground">{slide.title}</h2>
                    <p className="text-muted-foreground">{slide.description}</p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      <div className="flex flex-col items-center mt-8">
        <div className="flex gap-2 mb-8">
            {slides.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${current === i ? 'w-6 bg-primary' : 'w-2 bg-muted'}`} />
            ))}
        </div>
        <Button onClick={handleNext} size="lg" className="rounded-full">
            {current < slides.length - 1 ? "Lanjutkan" : "Mulai Curhat"}
            <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
