import React, { useRef, useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { VoiceSphere } from './VoiceSphere';
import { TranscriptPanel } from './TranscriptPanel';
import { ControlsBar } from './ControlsBar';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function VoiceCallPage() {
  const [isDark, setIsDark] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleMicDown = () => {
    if (!isMuted && SpeechRecognition) {
      setIsListening(true);
      setTranscript('');
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interim += event.results[i][0].transcript;
        }
        setTranscript(interim);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      navigator.vibrate?.(20);
    }
  };

  const handleMicUp = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleMute = () => setIsMuted(m => !m);
  const handleEnd = () => {
    alert('End call!');
  };
  const handleToggleTheme = () => setIsDark(d => !d);

  return (
    <div className={isDark ? 'dark bg-bg-primary min-h-screen' : 'bg-bg-primary min-h-screen'}>
      <HeaderBar onEnd={handleEnd} onToggleTheme={handleToggleTheme} isDark={isDark} />
      <VoiceSphere
        state={isMuted ? 'muted' : isListening ? 'listening' : 'idle'}
        onClickMic={handleMicDown}
        isMuted={isMuted}
      />
      <TranscriptPanel transcript={transcript} />
      <ControlsBar
        isMuted={isMuted}
        isListening={isListening}
        onMicDown={handleMicDown}
        onMicUp={handleMicUp}
        onMute={handleMute}
        onEnd={handleEnd}
      />
      {!SpeechRecognition && (
        <div className="text-center text-danger font-semibold mt-4">Browser tidak mendukung Voice Recognition.</div>
      )}
    </div>
  );
} 