import cv2
import numpy as np
import json
import base64
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import os
from pathlib import Path

class KeyFrameExtractor:
    """
    Extract key frames from video for analysis
    Selects 10 representative frames from different intervals
    """
    
    def __init__(self):
        self.max_frames = 10
        
    def extract_key_frames(self, video_path: str, output_dir: str) -> Dict:
        """
        Extract 10 key frames from different intervals of the video
        """
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video: {video_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            print(f"📹 Video info: {total_frames} frames, {fps:.1f} FPS, {duration:.1f}s duration")
            
            # Calculate frame intervals for 10 key frames
            frame_intervals = self._calculate_frame_intervals(total_frames)
            
            # Extract frames
            key_frames = []
            for i, frame_num in enumerate(frame_intervals):
                # Seek to frame
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
                ret, frame = cap.read()
                
                if ret:
                    # Calculate timestamp
                    timestamp = frame_num / fps if fps > 0 else 0
                    
                    # Save frame as image
                    frame_filename = f"key_frame_{i+1}.jpg"
                    frame_path = os.path.join(output_dir, frame_filename)
                    cv2.imwrite(frame_path, frame)
                    
                    # Encode image for Claude
                    image_base64 = self._encode_image_for_claude(frame_path)
                    
                    # Store frame info
                    key_frame_info = {
                        'frame_number': int(frame_num),
                        'timestamp': float(timestamp),
                        'filename': frame_filename,
                        'path': frame_path,
                        'interval': f"{(i+1)*10}%",  # 10%, 20%, 30%, ..., 100%
                        'image_base64': image_base64,
                        'image_encoded': True
                    }
                    key_frames.append(key_frame_info)
                    
                    print(f"✅ Extracted key frame {i+1}: Frame {frame_num} at {timestamp:.1f}s")
                else:
                    print(f"❌ Failed to extract frame {frame_num}")
            
            cap.release()
            
            # Create summary
            extraction_summary = {
                'video_path': video_path,
                'total_frames': total_frames,
                'fps': float(fps),
                'duration': float(duration),
                'extracted_frames': len(key_frames),
                'key_frames': key_frames,
                'extraction_timestamp': datetime.now().isoformat()
            }
            
            return extraction_summary
            
        except Exception as e:
            print(f"❌ Error extracting key frames: {e}")
            return {
                'error': str(e),
                'extracted_frames': 0,
                'key_frames': []
            }
    
    def _calculate_frame_intervals(self, total_frames: int) -> List[int]:
        """
        Calculate frame numbers for 10 evenly distributed intervals
        """
        if total_frames <= 10:
            # If video is very short, just take all frames
            return list(range(total_frames))
        
        # Calculate 10 intervals: 10%, 20%, 30%, ..., 100%
        intervals = []
        for i in range(1, 11):  # 1, 2, 3, ..., 10
            frame_num = int((i / 10) * total_frames) - 1  # -1 for 0-based indexing
            frame_num = max(0, min(frame_num, total_frames - 1))  # Ensure valid range
            intervals.append(frame_num)
        
        return intervals
    
    def extract_frames_with_pose_data(self, video_path: str, angle_data: List[Dict], output_dir: str) -> Dict:
        """
        Extract key frames and combine with pose data for analysis
        """
        try:
            # Extract key frames
            key_frame_info = self.extract_key_frames(video_path, output_dir)
            
            if key_frame_info.get('extracted_frames', 0) == 0:
                return key_frame_info
            
            # Match key frames with pose data
            enhanced_key_frames = []
            for key_frame in key_frame_info['key_frames']:
                frame_num = key_frame['frame_number']
                
                # Find corresponding pose data
                pose_data = self._find_pose_data_for_frame(angle_data, frame_num)
                
                enhanced_frame = {
                    **key_frame,
                    'pose_data': pose_data,
                    'has_pose_data': pose_data is not None
                }
                enhanced_key_frames.append(enhanced_frame)
            
            # Update summary
            key_frame_info['key_frames'] = enhanced_key_frames
            key_frame_info['pose_data_available'] = any(frame['has_pose_data'] for frame in enhanced_key_frames)
            
            return key_frame_info
            
        except Exception as e:
            print(f"❌ Error extracting frames with pose data: {e}")
            return {
                'error': str(e),
                'extracted_frames': 0,
                'key_frames': []
            }
    
    def _find_pose_data_for_frame(self, angle_data: List[Dict], target_frame: int) -> Optional[Dict]:
        """
        Find pose data for a specific frame number
        """
        for frame_data in angle_data:
            if frame_data.get('frame') == target_frame:
                return frame_data
        return None
    
    def create_analysis_package(self, video_path: str, angle_data: List[Dict], output_dir: str) -> Dict:
        """
        Create a complete analysis package with key frames and pose data
        """
        try:
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Extract key frames with pose data
            key_frame_info = self.extract_frames_with_pose_data(video_path, angle_data, output_dir)
            
            # Create analysis package
            analysis_package = {
                'video_analysis': {
                    'video_path': video_path,
                    'total_frames': key_frame_info.get('total_frames', 0),
                    'fps': key_frame_info.get('fps', 0),
                    'duration': key_frame_info.get('duration', 0)
                },
                'key_frames': key_frame_info.get('key_frames', []),
                'pose_analysis': {
                    'total_pose_frames': len(angle_data),
                    'pose_data_available': key_frame_info.get('pose_data_available', False),
                    'angle_summary': self._create_angle_summary(angle_data)
                },
                'extraction_metadata': {
                    'extraction_timestamp': datetime.now().isoformat(),
                    'extractor_version': '1.0.0',
                    'max_frames_extracted': self.max_frames
                }
            }
            
            # Save analysis package
            package_path = os.path.join(output_dir, 'analysis_package.json')
            with open(package_path, 'w') as f:
                json.dump(analysis_package, f, indent=2)
            
            print(f"✅ Analysis package saved to: {package_path}")
            
            return analysis_package
            
        except Exception as e:
            print(f"❌ Error creating analysis package: {e}")
            return {
                'error': str(e),
                'key_frames': [],
                'pose_analysis': {}
            }
    
    def _create_angle_summary(self, angle_data: List[Dict]) -> Dict:
        """
        Create a summary of angle data for analysis
        """
        if not angle_data:
            return {}
        
        # Collect all angle types
        angle_types = set()
        for frame_data in angle_data:
            angles = frame_data.get('angles', {})
            angle_types.update(angles.keys())
        
        # Calculate statistics for each angle type
        angle_summary = {}
        for angle_type in angle_types:
            values = []
            for frame_data in angle_data:
                angles = frame_data.get('angles', {})
                if angle_type in angles:
                    values.append(angles[angle_type])
            
            if values:
                angle_summary[angle_type] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values)),
                    'range': float(np.max(values) - np.min(values)),
                    'count': len(values)
                }
        
        return angle_summary
    
    def _encode_image_for_claude(self, image_path: str) -> str:
        """
        Encode image to base64 for Claude API
        """
        try:
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
                base64_encoded = base64.b64encode(image_data).decode('utf-8')
                return base64_encoded
        except Exception as e:
            print(f"❌ Error encoding image {image_path}: {e}")
            return ""

# Example usage
if __name__ == "__main__":
    extractor = KeyFrameExtractor()
    print("Key frame extractor initialized successfully!")
