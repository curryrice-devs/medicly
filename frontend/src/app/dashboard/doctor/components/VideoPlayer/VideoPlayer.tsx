import React from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';

interface Props {
  src: string;
}

export function VideoPlayer({ src }: Props) {
  const {
    videoRef,
    isPlaying,
    playbackRate,
    setPlaybackRate,
    playPause,
    stepFrame,
    requestFullscreen,
  } = useVideoPlayer();

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <video ref={videoRef} src={src || undefined} className="w-full" controls={false} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => stepFrame(-1)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">Prev</button>
        <button onClick={playPause} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={() => stepFrame(1)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">Next</button>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Speed</span>
          <select
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>

        <button onClick={requestFullscreen} className="ml-auto px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">Full screen</button>
      </div>
      <p className="mt-3 text-xs text-gray-500">Shortcuts: Space (play/pause), ←/→ (frame)</p>
    </div>
  );
}


