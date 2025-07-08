import React from 'react';

export const HeaderBar = ({onEnd, onToggleTheme, isDark}: {
  onEnd: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}) => (
  <header className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-bg-primary dark:bg-bg-primary">
    <div className="flex flex-col">
      <span className="font-bold text-lg text-primary dark:text-primary">Telepon Curhat</span>
      <span className="text-xs text-gray-500 dark:text-gray-300">Aku di sini untuk mendengarkan…</span>
    </div>
    <div className="flex items-center gap-3">
      <button
        aria-label="Toggle Theme"
        onClick={onToggleTheme}
        className="text-xl focus:outline-none"
      >
        {isDark ? '🌙' : '☀️'}
      </button>
      <button
        aria-label="End Call"
        onClick={onEnd}
        className="ml-2 px-3 py-1 rounded-lg bg-danger/90 text-white font-semibold text-sm shadow hover:bg-danger transition-colors"
      >
        ⏹ End
      </button>
    </div>
  </header>
); 