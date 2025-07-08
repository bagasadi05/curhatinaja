import React, { useRef, useState } from 'react';

export const TranscriptPanel = ({ transcript }: { transcript: string }) => {
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div
      ref={panelRef}
      className="w-full max-w-xl mx-auto h-[35vh] mt-2 mb-4 rounded-2xl bg-card-bg dark:bg-card-bg backdrop-blur-lg shadow-lg p-4 overflow-y-auto cursor-pointer transition-colors select-text"
      onClick={handleCopy}
      title="Tap untuk copy transkrip"
    >
      {transcript ? (
        <div className="text-base text-primary dark:text-primary animate-typewriter whitespace-pre-line">
          {transcript}
        </div>
      ) : (
        <div className="text-base text-gray-400 italic">Transkrip suara akan muncul di sini…</div>
      )}
      {copied && <div className="text-xs text-green-500 mt-2">Disalin!</div>}
    </div>
  );
}; 