import cv2
import mediapipe as mp
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SimpleOverlayProcessor:
    """
    MediaPipe pose estimation processor that overlays pose landmarks on video
    """
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
    
    def process_video(self, input_path: str, output_path: str) -> tuple[bool, str]:
        """
        Process video with MediaPipe pose estimation overlay
        Returns (success: bool, actual_output_path: str)
        """
        try:
            logger.info(f"Starting video processing: {input_path} -> {output_path}")
            
            # Load input video
            cap = cv2.VideoCapture(input_path)
            
            if not cap.isOpened():
                logger.error(f"Could not open video {input_path}")
                return False, ""
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"Processing video: {width}x{height} @ {fps} FPS")
            
            # Define output video writer - try multiple codecs for compatibility
            fourcc = cv2.VideoWriter_fourcc(*"XVID")
            avi_output_path = output_path.replace('.mp4', '.avi')
            out = cv2.VideoWriter(avi_output_path, fourcc, fps, (width, height))
            
            if not out.isOpened():
                logger.warning("XVID failed, trying mp4v...")
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                avi_output_path = output_path
                
            if not out.isOpened():
                logger.error(f"Could not create output video with any codec")
                cap.release()
                return False, ""
            
            # Update output_path to match what was actually created
            actual_output_path = avi_output_path
            logger.info(f"Using output format: {actual_output_path}")
            
            frame_count = 0
            poses_detected = 0
            
            with self.mp_pose.Pose(
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
                model_complexity=1
            ) as pose:
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    frame_count += 1
                    
                    # Convert BGR → RGB for MediaPipe
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    results = pose.process(rgb_frame)
                    
                    # Draw landmarks if detected
                    if results.pose_landmarks:
                        poses_detected += 1
                        self.mp_drawing.draw_landmarks(
                            frame, 
                            results.pose_landmarks, 
                            self.mp_pose.POSE_CONNECTIONS,
                            landmark_drawing_spec=self.mp_drawing.DrawingSpec(
                                color=(0, 255, 0),  # Green landmarks
                                thickness=2,
                                circle_radius=2
                            ),
                            connection_drawing_spec=self.mp_drawing.DrawingSpec(
                                color=(255, 0, 0),  # Red connections
                                thickness=2
                            )
                        )
                    
                    out.write(frame)
                    
                    # Progress logging every 30 frames
                    if frame_count % 30 == 0:
                        logger.info(f"Processed {frame_count} frames, poses detected in {poses_detected}")
            
            cap.release()
            out.release()
            
            logger.info(f"✅ Processing complete!")
            logger.info(f"Total frames: {frame_count}")
            logger.info(f"Frames with poses: {poses_detected}")
            logger.info(f"Output saved to: {actual_output_path}")
            
            # Verify output file was created
            if os.path.exists(actual_output_path):
                file_size = os.path.getsize(actual_output_path)
                logger.info(f"Output file size: {file_size} bytes")
                return True, actual_output_path
            else:
                logger.error("Output file was not created successfully")
                return False, ""
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            import traceback
            traceback.print_exc()
            return False, ""

if __name__ == "__main__":
    # Test the processor
    processor = SimpleOverlayProcessor()
    
    input_video = "test_input.mp4"
    output_video = "test_output.mp4"
    
    if os.path.exists(input_video):
        success, output_path = processor.process_video(input_video, output_video)
        if success:
            print(f"🎉 Video processing successful! Output: {output_path}")
        else:
            print("❌ Video processing failed!")
    else:
        print(f"❌ Input video {input_video} not found!")
        print("Place your video file as 'test_input.mp4' in this directory to test.") 