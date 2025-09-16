/**
 * Video Rotation Detection and Correction Utilities
 *
 * This module provides utilities to detect and correct video rotation issues
 * caused by mobile devices that embed rotation metadata instead of rotating pixels.
 */

export type RotationAngle = 0 | 90 | 180 | 270;

export interface VideoRotationInfo {
  angle: RotationAngle;
  needsCorrection: boolean;
  transform: string;
  containerStyle: {
    transform: string;
    width?: string;
    height?: string;
  };
}

/**
 * Extract rotation metadata from a video file
 * Returns the rotation angle in degrees
 */
export async function extractVideoRotation(file: File): Promise<RotationAngle> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      try {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to first frame
        video.currentTime = 0.1;
      } catch (error) {
        console.error('Error loading video metadata:', error);
        resolve(0);
      }
    };

    video.onseeked = () => {
      try {
        if (!ctx) {
          resolve(0);
          return;
        }

        // Draw first frame to analyze dimensions
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detect rotation based on aspect ratio and common mobile patterns
        const aspectRatio = video.videoWidth / video.videoHeight;

        // For mobile videos, if width < height but it's landscape content,
        // it's likely rotated 90 degrees
        if (aspectRatio < 1 && isLikelyLandscapeContent(video)) {
          resolve(90);
        } else if (aspectRatio > 1 && isLikelyPortraitContent(video)) {
          resolve(270);
        } else {
          resolve(0);
        }
      } catch (error) {
        console.error('Error analyzing video frame:', error);
        resolve(0);
      }
    };

    video.onerror = () => {
      console.error('Error loading video for rotation detection');
      resolve(0);
    };

    // Load video
    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();

    // Cleanup after analysis
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);
  });
}

/**
 * Heuristic to detect if a video with portrait dimensions contains landscape content
 */
function isLikelyLandscapeContent(video: HTMLVideoElement): boolean {
  // Common indicators that a portrait-dimensioned video is actually rotated landscape:
  // 1. Common mobile recording resolutions when rotated
  const width = video.videoWidth;
  const height = video.videoHeight;

  // Common mobile resolutions that indicate rotation
  const commonMobilePortraitToLandscape = [
    { w: 720, h: 1280 }, // 720p rotated
    { w: 1080, h: 1920 }, // 1080p rotated
    { w: 1080, h: 2280 }, // Modern phone aspect ratios
    { w: 828, h: 1792 }, // iPhone XR dimensions
  ];

  return commonMobilePortraitToLandscape.some(
    res => Math.abs(width - res.w) < 50 && Math.abs(height - res.h) < 50
  );
}

/**
 * Heuristic to detect if a video with landscape dimensions contains portrait content
 */
function isLikelyPortraitContent(video: HTMLVideoElement): boolean {
  // This is less common, but can happen with some recording apps
  const width = video.videoWidth;
  const height = video.videoHeight;

  // Very wide aspect ratios might indicate rotated portrait content
  const aspectRatio = width / height;
  return aspectRatio > 2.5;
}

/**
 * Extract rotation from EXIF-like metadata for video files
 * This is a more advanced approach that tries to read actual rotation metadata
 */
export async function extractVideoRotationFromMetadata(file: File): Promise<RotationAngle> {
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer, 0, Math.min(8192, buffer.byteLength));

    // Look for rotation metadata in the file header
    // This is a simplified approach - real EXIF parsing would be more complex
    const textDecoder = new TextDecoder();
    const headerString = textDecoder.decode(uint8Array);

    // Look for common rotation indicators in metadata
    if (headerString.includes('rotate') || headerString.includes('rotation')) {
      // Try to extract rotation value
      const rotationMatch = headerString.match(/rotate[^0-9]*(\d+)/i);
      if (rotationMatch) {
        const rotation = parseInt(rotationMatch[1]);
        if ([0, 90, 180, 270].includes(rotation)) {
          return rotation as RotationAngle;
        }
      }
    }

    // Fallback to dimension-based detection
    return extractVideoRotation(file);
  } catch (error) {
    console.error('Error extracting rotation from metadata:', error);
    return extractVideoRotation(file);
  }
}

/**
 * Get rotation information including CSS transforms needed to correct the video
 */
export function getVideoRotationInfo(angle: RotationAngle): VideoRotationInfo {
  const needsCorrection = angle !== 0;

  let transform = '';
  let containerStyle: VideoRotationInfo['containerStyle'] = { transform: '' };

  switch (angle) {
    case 90:
      transform = 'rotate(270deg)'; // Counter-rotate to fix
      containerStyle = {
        transform: 'rotate(270deg)',
        width: 'max-content',
        height: 'max-content',
      };
      break;
    case 180:
      transform = 'rotate(180deg)';
      containerStyle = {
        transform: 'rotate(180deg)',
      };
      break;
    case 270:
      transform = 'rotate(90deg)'; // Counter-rotate to fix
      containerStyle = {
        transform: 'rotate(90deg)',
        width: 'max-content',
        height: 'max-content',
      };
      break;
    default:
      transform = 'none';
      containerStyle = { transform: 'none' };
  }

  return {
    angle,
    needsCorrection,
    transform,
    containerStyle,
  };
}

/**
 * Apply rotation correction to a video element
 */
export function applyVideoRotationCorrection(
  videoElement: HTMLVideoElement,
  rotationInfo: VideoRotationInfo
): void {
  if (!rotationInfo.needsCorrection) {
    return;
  }

  // Apply transform to the video element
  videoElement.style.transform = rotationInfo.transform;

  // For 90/270 degree rotations, we need to adjust the container
  if (rotationInfo.angle === 90 || rotationInfo.angle === 270) {
    const container = videoElement.parentElement;
    if (container) {
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      container.style.overflow = 'hidden';
    }
  }
}

/**
 * Detect and apply rotation correction in one step
 */
export async function detectAndCorrectVideoRotation(
  file: File,
  videoElement: HTMLVideoElement
): Promise<VideoRotationInfo> {
  try {
    const rotation = await extractVideoRotationFromMetadata(file);
    const rotationInfo = getVideoRotationInfo(rotation);

    applyVideoRotationCorrection(videoElement, rotationInfo);

    return rotationInfo;
  } catch (error) {
    console.error('Error in detectAndCorrectVideoRotation:', error);
    return {
      angle: 0,
      needsCorrection: false,
      transform: 'none',
      containerStyle: { transform: 'none' },
    };
  }
}


