"use client";

import { useState, useEffect } from 'react';
import { VideoRotationInfo, detectAndCorrectVideoRotation } from '@/utils/videoRotation';

/**
 * Auto-detect video rotation when video loads
 * This hook provides automatic video rotation detection and correction
 */
export function useVideoRotationDetection(
  videoRef: { current: HTMLVideoElement | null },
  videoFile?: File
) {
  const [rotationInfo, setRotationInfo] = useState<VideoRotationInfo>({
    angle: 0,
    needsCorrection: false,
    transform: 'none',
    containerStyle: { transform: 'none' },
  });

  useEffect(() => {
    if (videoFile && videoRef.current) {
      detectAndCorrectVideoRotation(videoFile, videoRef.current)
        .then(setRotationInfo)
        .catch(error => {
          console.error('Failed to detect video rotation:', error);
        });
    }
  }, [videoFile, videoRef]);

  return rotationInfo;
}
