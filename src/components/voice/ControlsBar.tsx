import React from 'react';

type ControlsBarProps = {
  isMuted: boolean;
  isListening: boolean;
  onMicDown: () => void;
  onMicUp: () => void;
  onMute: () => void;
  onEnd: () => void;
};

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isMuted,
  isListening,
  onMicDown,
  onMicUp,
  onMute,
  onEnd,
}) => (
  <div className="flex justify-center gap-4 mt-4">
    <button onClick={onMute} className="px-4 py-2 rounded bg-gray-700 text-white">
      {isMuted ? 'Unmute' : 'Mute'}
    </button>
    <button
      onMouseDown={onMicDown}
      onMouseUp={onMicUp}
      className={`px-4 py-2 rounded ${isListening ? 'bg-green-600' : 'bg-blue-600'} text-white`}
    >
      {isListening ? 'Listening...' : 'Hold to Talk'}
    </button>
    <button onClick={onEnd} className="px-4 py-2 rounded bg-red-600 text-white">
      End
    </button>
  </div>
); 