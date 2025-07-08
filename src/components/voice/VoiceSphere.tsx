import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const VoiceSphere = ({
  state = 'idle',
  onClickMic,
  isMuted = false,
}: {
  state: 'idle' | 'listening' | 'muted' | 'loading',
  onClickMic: () => void,
  isMuted?: boolean,
}) => (
  <div className="relative flex items-center justify-center h-[220px] w-[220px] mx-auto my-6">
    {/* Swirl Gradient Sphere */}
    <motion.div
      className="absolute inset-0 rounded-full shadow-2xl"
      style={{
        background: 'linear-gradient(135deg,#7D4CFF,#02C8FF,#FF4D8B)',
        filter: 'blur(0.5px)',
      }}
      animate={{ rotate: state === 'idle' ? 0 : 360 }}
      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
    />
    {/* Glow */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/30 via-blue-400/20 to-pink-400/10 blur-2xl z-0" />
    {/* Ripple saat listening */}
    <AnimatePresence>
      {state === 'listening' && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-300/40"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.25, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
        />
      )}
    </AnimatePresence>
    {/* Bubble 3D saat bicara */}
    <AnimatePresence>
      {state === 'listening' &&
        [...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 left-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-200 via-pink-200 to-purple-200 opacity-70 blur-sm shadow-lg"
            style={{
              transform: `translateX(${(i - 3) * 40}px)`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 0.7, 0], y: -80 }}
            transition={{ delay: i * 0.2, duration: 1.2, repeat: Infinity, repeatType: 'loop' }}
          />
        ))}
    </AnimatePresence>
    {/* Mic Button */}
    <button
      aria-label="Mic"
      onClick={onClickMic}
      className={
        `relative z-10 w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-lg focus:outline-none transition-all
        ${isMuted ? 'bg-gray-400' : 'bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400'}
        ${state === 'listening' ? 'animate-pulse' : ''}`
      }
      style={{ touchAction: 'manipulation' }}
    >
      <span className="text-3xl">
        {isMuted ? '🚫' : state === 'listening' ? '🎧' : '🎙️'}
      </span>
    </button>
    {/* Loading spinner */}
    {state === 'loading' && (
      <span className="absolute inset-0 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </span>
    )}
  </div>
); 