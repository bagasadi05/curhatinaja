"use client";

import { useState, useEffect } from 'react';
import { ChatInterface } from "@/components/chat-interface";
import { OnboardingFlow } from '@/components/onboarding-flow';


const ONBOARDING_KEY = 'curhatinaja-onboarding-complete';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const onboardingComplete = localStorage.getItem(ONBOARDING_KEY);
      if (onboardingComplete !== 'true') {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Tidak dapat mengakses localStorage", error);
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error("Tidak dapat mengatur item localStorage", error);
    } finally {
      setShowOnboarding(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <main>
      {showOnboarding ? (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      ) : (
        <ChatInterface />
      )}
    </main>
  );
}
