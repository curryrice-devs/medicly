import React, { useState, useRef, useEffect } from 'react';
import { VideoRotationInfo, getVideoRotationInfo, applyVideoRotationCorrection } from '@/utils/videoRotation';

interface VideoEditorProps {
  videoUrl: string;
  videoFile?: File;
  keyFrames?: Array<{
    frame_number: number;
    timestamp: number;
    filename: string;
    image_base64?: string;
    pose_data?: any;
  }>;
  onFrameSelect?: (frameNumber: number) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({
  videoUrl,
  videoFile,
  keyFrames = [],
  onFrameSelect
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [rotationInfo, setRotationInfo] = useState<VideoRotationInfo>({
    angle: 0,
    needsCorrection: false,
    transform: 'none',
    containerStyle: { transform: 'none' },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setTotalFrames(Math.floor(video.duration * 30)); // Assuming 30 FPS
      setIsVideoLoaded(true);
      console.log('Video loaded:', video.duration, 'seconds,', Math.floor(video.duration * 30), 'frames');
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setCurrentFrame(Math.floor(video.currentTime * 30));
    };

    const handleCanPlay = () => {
      console.log('Video can play');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl]);

  // Handle video rotation detection and correction
  useEffect(() => {
    const detectAndApplyRotation = async () => {
      if (!videoFile || !videoRef.current) return;

      try {
        const { extractVideoRotationFromMetadata, getVideoRotationInfo, applyVideoRotationCorrection } = await import('@/utils/videoRotation');

        const rotation = await extractVideoRotationFromMetadata(videoFile);
        const rotationInfo = getVideoRotationInfo(rotation);

        console.log('Detected video rotation:', rotation, 'degrees');

        setRotationInfo(rotationInfo);
        applyVideoRotationCorrection(videoRef.current, rotationInfo);
      } catch (error) {
        console.error('Error detecting video rotation:', error);
      }
    };

    detectAndApplyRotation();
  }, [videoFile]);

  // Debug keyframes
  useEffect(() => {
    console.log('VideoEditor received keyframes:', keyFrames);
  }, [keyFrames]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (frameNumber: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const fps = 30; // Assuming 30 FPS
    const time = frameNumber / fps;
    video.currentTime = Math.min(time, video.duration);
    setCurrentFrame(frameNumber);
    onFrameSelect?.(frameNumber);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const frameNumber = parseInt(event.target.value);
    handleSeek(frameNumber);
  };

  const goToPreviousFrame = () => {
    if (currentFrame > 0) {
      handleSeek(currentFrame - 1);
    }
  };

  const goToNextFrame = () => {
    if (currentFrame < totalFrames - 1) {
      handleSeek(currentFrame + 1);
    }
  };

  const goToKeyFrame = (keyFrame: any) => {
    console.log('Going to keyframe:', keyFrame);
    if (keyFrame.frame_number !== undefined) {
      handleSeek(keyFrame.frame_number);
    } else if (keyFrame.timestamp !== undefined) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = keyFrame.timestamp;
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Editor</h3>
      
      {/* Video Player */}
      <div className="mb-4">
        <div
          className="w-full h-64 bg-black rounded-lg flex items-center justify-center overflow-hidden"
          style={rotationInfo.needsCorrection ? rotationInfo.containerStyle : undefined}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full"
            controls={false}
            style={rotationInfo.needsCorrection ? { transform: rotationInfo.transform } : undefined}
          />
        </div>
        {rotationInfo.needsCorrection && (
          <div className="mt-2 text-sm text-gray-600 flex items-center justify-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              ↻ Auto-corrected rotation: {rotationInfo.angle}°
            </span>
          </div>
        )}
      </div>

      {/* Frame Navigation Controls */}
      <div className="mb-4 space-y-4">
        {/* Play/Pause and Frame Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={goToPreviousFrame}
            disabled={!isVideoLoaded || currentFrame <= 0}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          
          <button
            onClick={goToNextFrame}
            disabled={!isVideoLoaded || currentFrame >= totalFrames - 1}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
          
          <span className="text-sm text-gray-600">
            Frame {currentFrame} / {totalFrames}
          </span>
          
          <span className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Frame Slider */}
        <div className="w-full">
          <input
            type="range"
            min="0"
            max={totalFrames - 1}
            value={currentFrame}
            onChange={handleSliderChange}
            disabled={!isVideoLoaded}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Key Frames Display */}
      {keyFrames.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Key Frames</h4>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {keyFrames.map((keyFrame, index) => (
              <div
                key={index}
                className="flex-shrink-0 cursor-pointer"
                onClick={() => goToKeyFrame(keyFrame)}
              >
                <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden border-2 border-blue-500">
                  {keyFrame.image_base64 ? (
                    <img
                      src={`data:image/jpeg;base64,${keyFrame.image_base64}`}
                      alt={`Key frame ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      Frame {keyFrame.frame_number}
                    </div>
                  )}
                </div>
                <div className="text-xs text-center mt-1">
                  <div>{formatTime(keyFrame.timestamp)}</div>
                  <div>Frame {keyFrame.frame_number}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frame Information */}
      <div className="text-sm text-gray-600">
        <div>Current Frame: {currentFrame}</div>
        <div>Time: {formatTime(currentTime)}</div>
        <div>Duration: {formatTime(duration)}</div>
      </div>
    </div>
  );
};

export default VideoEditor;
