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
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="relative overflow-hidden rounded-lg">
        <video ref={videoRef} src={src} className="w-full" controls={false} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => stepFrame(-1)} className="px-3 py-2 text-sm rounded-full bg-white/10 hover:bg-white/20">Prev</button>
        <button onClick={playPause} className="px-4 py-2 text-sm rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium">{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={() => stepFrame(1)} className="px-3 py-2 text-sm rounded-full bg-white/10 hover:bg-white/20">Next</button>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-sm text-white/70">Speed</span>
          <select
            className="rounded-full bg-white/10 border border-white/10 px-2 py-1 text-sm"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>

        <button onClick={requestFullscreen} className="ml-auto px-3 py-2 text-sm rounded-full bg-white/10 hover:bg-white/20">Full screen</button>
      </div>
      <p className="mt-2 text-xs text-white/50">Shortcuts: Space (play/pause), ←/→ (frame)</p>
    </div>
  );
}


