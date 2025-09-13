import cv2
import mediapipe as mp
import os
import shutil
import tempfile
from moviepy.video.io.VideoFileClip import VideoFileClip
import numpy as np
import json

class AngleCalculator:
    """Simple angle calculator for pose landmarks"""
    
    def calculate_joint_angles(self, landmarks):
        """Calculate joint angles from MediaPipe landmarks"""
        if not landmarks:
            return {}
        
        angles = {}
        
        try:
            # Get landmark points
            points = landmarks.landmark
            
            # Calculate knee angles
            if self._has_landmarks(points, [23, 25, 27]):  # Left hip, knee, ankle
                left_knee_angle = self._calculate_angle(
                    points[23], points[25], points[27]
                )
                angles['left_knee_angle'] = left_knee_angle
            
            if self._has_landmarks(points, [24, 26, 28]):  # Right hip, knee, ankle
                right_knee_angle = self._calculate_angle(
                    points[24], points[26], points[28]
                )
                angles['right_knee_angle'] = right_knee_angle
            
            # Calculate elbow angles
            if self._has_landmarks(points, [11, 13, 15]):  # Left shoulder, elbow, wrist
                left_elbow_angle = self._calculate_angle(
                    points[11], points[13], points[15]
                )
                angles['left_elbow_angle'] = left_elbow_angle
            
            if self._has_landmarks(points, [12, 14, 16]):  # Right shoulder, elbow, wrist
                right_elbow_angle = self._calculate_angle(
                    points[12], points[14], points[16]
                )
                angles['right_elbow_angle'] = right_elbow_angle
            
            # Calculate hip angles
            if self._has_landmarks(points, [11, 23, 25]):  # Left shoulder, hip, knee
                left_hip_angle = self._calculate_angle(
                    points[11], points[23], points[25]
                )
                angles['left_hip_angle'] = left_hip_angle
            
            if self._has_landmarks(points, [12, 24, 26]):  # Right shoulder, hip, knee
                right_hip_angle = self._calculate_angle(
                    points[12], points[24], points[26]
                )
                angles['right_hip_angle'] = right_hip_angle
            
            # Calculate shoulder angles
            if self._has_landmarks(points, [11, 12, 13]):  # Left shoulder, right shoulder, left elbow
                left_shoulder_angle = self._calculate_angle(
                    points[11], points[12], points[13]
                )
                angles['left_shoulder_angle'] = left_shoulder_angle
            
            if self._has_landmarks(points, [12, 11, 14]):  # Right shoulder, left shoulder, right elbow
                right_shoulder_angle = self._calculate_angle(
                    points[12], points[11], points[14]
                )
                angles['right_shoulder_angle'] = right_shoulder_angle
                
        except Exception as e:
            print(f"Error calculating angles: {e}")
            return {}
        
        return angles
    
    def _has_landmarks(self, points, indices):
        """Check if all required landmarks are visible"""
        for idx in indices:
            if idx >= len(points) or points[idx].visibility < 0.5:
                return False
        return True
    
    def _calculate_angle(self, point1, point2, point3):
        """Calculate angle between three points"""
        try:
            # Convert to numpy arrays
            p1 = np.array([point1.x, point1.y])
            p2 = np.array([point2.x, point2.y])
            p3 = np.array([point3.x, point3.y])
            
            # Calculate vectors
            v1 = p1 - p2
            v2 = p3 - p2
            
            # Calculate angle
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            cos_angle = np.clip(cos_angle, -1.0, 1.0)  # Clamp to avoid numerical errors
            angle = np.arccos(cos_angle)
            
            # Convert to degrees
            return np.degrees(angle)
            
        except Exception as e:
            print(f"Error calculating angle: {e}")
            return 0.0

class SimpleProcessor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.angle_calculator = AngleCalculator()
        
        # Landmark names for reference (33 landmarks total)
        self.landmark_names = [
            "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner",
            "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left",
            "mouth_right", "left_shoulder", "right_shoulder", "left_elbow",
            "right_elbow", "left_wrist", "right_wrist", "left_pinky",
            "right_pinky", "left_index", "right_index", "left_thumb",
            "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee",
            "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index",
            "right_foot_index"
        ]

    def process_video(self, input_path: str, output_path: str) -> tuple[bool, str]:
        try:
            print("=" * 50)
            print("DEBUG: process_video method called with updated code")
            print(f"Starting MediaPipe pose detection on {input_path}")
            print("=" * 50)
            
            # Create temporary directory for intermediate files
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_output = os.path.join(temp_dir, "temp_processed.mp4")
                
                # Initialize MediaPipe pose detection
                with self.mp_pose.Pose(
                    static_image_mode=False,
                    model_complexity=1,
                    enable_segmentation=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                ) as pose:
                    
                    # Open input video
                    cap = cv2.VideoCapture(input_path)
                    if not cap.isOpened():
                        print(f"Error: Could not open video {input_path}")
                        return False, ""
                    
                    # Get video properties
                    fps = int(cap.get(cv2.CAP_PROP_FPS))
                    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    
                    print(f"Video properties: {width}x{height}, {fps} FPS, {total_frames} frames")
                    
                    # Use H264 codec for better MP4 compatibility
                    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                    out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))
                    
                    if not out.isOpened():
                        print("Failed to initialize VideoWriter with mp4v, trying H264...")
                        fourcc = cv2.VideoWriter_fourcc(*'H264')
                        out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))
                        
                        if not out.isOpened():
                            print("Failed to initialize VideoWriter, using XVID...")
                            fourcc = cv2.VideoWriter_fourcc(*'XVID')
                            out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))
                    
                    if not out.isOpened():
                        print(f"Error: Could not initialize VideoWriter")
                        cap.release()
                        return False, ""
                    
                    print("VideoWriter initialized successfully")
                    
                    frame_count = 0
                    processed_frames = []
                    angle_data = []
                    landmarks_data = []
                    
                    print("DEBUG: Starting video processing loop with angle data collection")
                    
                    while cap.isOpened():
                        ret, frame = cap.read()
                        if not ret:
                            break
                        
                        # Convert BGR to RGB for MediaPipe
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        
                        # Process frame with MediaPipe
                        results = pose.process(rgb_frame)
                        
                        # Debug pose detection
                        if frame_count == 0:
                            print(f"DEBUG: First frame - pose landmarks detected: {results.pose_landmarks is not None}")
                            if results.pose_landmarks:
                                print(f"DEBUG: First frame - number of landmarks: {len(results.pose_landmarks.landmark)}")
                        
                        # Draw pose landmarks on the frame
                        if results.pose_landmarks:
                            self.mp_drawing.draw_landmarks(
                                frame,
                                results.pose_landmarks,
                                self.mp_pose.POSE_CONNECTIONS,
                                landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                                connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2)
                            )
                            
                            # Extract landmarks for angle calculation
                            landmarks = []
                            for i, landmark in enumerate(results.pose_landmarks.landmark):
                                landmarks.append({
                                    'name': self.landmark_names[i],
                                    'x': landmark.x,
                                    'y': landmark.y,
                                    'z': landmark.z,
                                    'visibility': landmark.visibility
                                })
                            
                            # Calculate angles for this frame
                            frame_angles = self.angle_calculator.calculate_joint_angles(landmarks)
                            if frame_angles:
                                angle_data.append({
                                    'frame': frame_count,
                                    'timestamp': frame_count / fps,
                                    'angles': frame_angles
                                })
                                if frame_count == 0:  # Debug first frame
                                    print(f"First frame angles: {frame_angles}")
                            else:
                                if frame_count == 0:  # Debug first frame
                                    print(f"No angles calculated for first frame. Landmarks count: {len(landmarks)}")
                                    print(f"Sample landmark: {landmarks[0] if landmarks else 'None'}")
                            
                            # Store landmarks data for ICON viewer
                            landmarks_data.append({
                                'frame': frame_count,
                                'timestamp': frame_count / fps,
                                'landmarks_2d': [{
                                    'name': landmark['name'],
                                    'index': i,
                                    'pixel': {
                                        'x': int(landmark['x'] * width),
                                        'y': int(landmark['y'] * height)
                                    },
                                    'normalized': {
                                        'x': landmark['x'],
                                        'y': landmark['y'],
                                        'z': landmark['z']
                                    },
                                    'visibility': landmark['visibility'],
                                    'presence': 1.0
                                } for i, landmark in enumerate(landmarks)],
                                'pose_detected': True
                            })
                        
                        # Write frame to output video
                        out.write(frame)
                        frame_count += 1
                        
                        if frame_count % 30 == 0:  # Log progress every 30 frames
                            print(f"Processed {frame_count}/{total_frames} frames")
                    
                    # Release everything
                    cap.release()
                    out.release()
                    
                    # Check if temp file was created
                    if not os.path.exists(temp_output):
                        print(f"Error: Temporary output file was not created")
                        return False, ""
                    
                    print(f"Temporary file created: {os.path.getsize(temp_output)} bytes")
                    
                    # Use MoviePy to ensure proper MP4 format
                    try:
                        print("Converting to proper MP4 format using MoviePy...")
                        clip = VideoFileClip(temp_output)
                        
                        # Write final MP4 with proper encoding
                        clip.write_videofile(
                            output_path,
                            codec='libx264',
                            audio_codec='aac',
                            temp_audiofile='temp-audio.m4a',
                            remove_temp=True
                        )
                        clip.close()
                        
                        # Verify the final file was created
                        if os.path.exists(output_path):
                            file_size = os.path.getsize(output_path)
                            print(f"Successfully processed video with pose detection: {output_path}")
                            print(f"Final output file size: {file_size} bytes")
                            print(f"Processed {frame_count} frames total")
                            
                            # Save angle data after successful video processing
                            print("DEBUG: Reached angle data saving section")
                            print(f"Total angle data entries: {len(angle_data)}")
                            print(f"Total landmarks data entries: {len(landmarks_data)}")
                            
                            if angle_data:
                                # Extract video_id from output_path and create proper filename
                                video_id = os.path.basename(output_path).replace('_output.mp4', '')
                                angle_output_path = os.path.join(os.path.dirname(output_path), f"{video_id}_output_angles.json")
                                angle_summary = self._create_angle_summary(angle_data)
                                key_frames = self._find_key_frames(angle_data)
                                
                                with open(angle_output_path, 'w') as f:
                                    json.dump({
                                        'video_info': {
                                            'fps': fps,
                                            'width': width,
                                            'height': height,
                                            'total_frames': total_frames
                                        },
                                        'angle_data': angle_data,
                                        'angle_summary': angle_summary,
                                        'key_frames': key_frames,  # Key frames for Claude analysis
                                        'angle_descriptions': self.angle_calculator.get_angle_descriptions(),
                                        'health_ranges': self.angle_calculator.get_health_ranges(),
                                        'landmarks_data': landmarks_data  # Include landmarks for ICON viewer
                                    }, f, indent=2)
                                
                                print(f"Angle data saved to: {angle_output_path}")
                                print(f"Angle data file size: {os.path.getsize(angle_output_path)} bytes")
                                print(f"DEBUG: Expected API path: {os.path.join(os.path.dirname(output_path), f'{video_id}_output_angles.json')}")
                            else:
                                print("No angle data to save - no angles were calculated!")
                            
                            return True, output_path
                        else:
                            print("Error: Final MP4 file was not created")
                            return False, ""
                            
                    except Exception as e:
                        print(f"MoviePy conversion error: {e}")
                        # Fallback: copy temp file to output
                        try:
                            shutil.copy2(temp_output, output_path)
                            if os.path.exists(output_path):
                                file_size = os.path.getsize(output_path)
                                print(f"Fallback: Copied temp file to {output_path}")
                                print(f"Output file size: {file_size} bytes")
                                
                                # Save angle data after successful fallback
                                print(f"Total angle data entries: {len(angle_data)}")
                                print(f"Total landmarks data entries: {len(landmarks_data)}")
                                
                                if angle_data:
                                    # Extract video_id from output_path and create proper filename
                                    video_id = os.path.basename(output_path).replace('_output.mp4', '')
                                    angle_output_path = os.path.join(os.path.dirname(output_path), f"{video_id}_output_angles.json")
                                    angle_summary = self._create_angle_summary(angle_data)
                                    key_frames = self._find_key_frames(angle_data)
                                    
                                    with open(angle_output_path, 'w') as f:
                                        json.dump({
                                            'video_info': {
                                                'fps': fps,
                                                'width': width,
                                                'height': height,
                                                'total_frames': total_frames
                                            },
                                            'angle_data': angle_data,
                                            'angle_summary': angle_summary,
                                            'key_frames': key_frames,  # Key frames for Claude analysis
                                            'angle_descriptions': self.angle_calculator.get_angle_descriptions(),
                                            'health_ranges': self.angle_calculator.get_health_ranges(),
                                            'landmarks_data': landmarks_data  # Include landmarks for ICON viewer
                                        }, f, indent=2)
                                    
                                    print(f"Angle data saved to: {angle_output_path}")
                                    print(f"Angle data file size: {os.path.getsize(angle_output_path)} bytes")
                                    print(f"DEBUG: Expected API path: {os.path.join(os.path.dirname(output_path), f'{video_id}_output_angles.json')}")
                                else:
                                    print("No angle data to save - no angles were calculated!")
                                
                                return True, output_path
                        except Exception as copy_error:
                            print(f"Fallback copy error: {copy_error}")
                        
                        return False, ""

        except Exception as e:
            print(f"Error processing video: {e}")
            return False, ""
    
    def _find_key_frames(self, angle_data: list) -> dict:
        """
        Find key frames based on angle analysis for Claude analysis
        Adaptive algorithm that detects different movement patterns
        """
        if not angle_data:
            return {}
        
        # Analyze movement type first
        movement_type = self._analyze_movement_type(angle_data)
        
        key_frames = {
            'movement_type': movement_type,
            'key_moments': []
        }
        
        if movement_type == 'walking':
            key_frames.update(self._find_walking_key_frames(angle_data))
        elif movement_type == 'exercise':
            key_frames.update(self._find_exercise_key_frames(angle_data))
        else:
            key_frames.update(self._find_general_key_frames(angle_data))
        
        return key_frames
    
    def _analyze_movement_type(self, angle_data: list) -> str:
        """Analyze the type of movement based on angle patterns"""
        if not angle_data:
            return 'unknown'
        
        # Calculate movement characteristics
        knee_angles = []
        elbow_angles = []
        hip_angles = []
        
        for frame_data in angle_data:
            angles = frame_data.get('angles', {})
            
            if 'left_knee_angle' in angles and 'right_knee_angle' in angles:
                knee_angles.append((angles['left_knee_angle'] + angles['right_knee_angle']) / 2)
            
            if 'left_elbow_angle' in angles and 'right_elbow_angle' in angles:
                elbow_angles.append((angles['left_elbow_angle'] + angles['right_elbow_angle']) / 2)
            
            if 'left_hip_angle' in angles and 'right_hip_angle' in angles:
                hip_angles.append((angles['left_hip_angle'] + angles['right_hip_angle']) / 2)
        
        if not knee_angles:
            return 'unknown'
        
        # Analyze patterns
        knee_range = max(knee_angles) - min(knee_angles)
        knee_variance = np.var(knee_angles) if len(knee_angles) > 1 else 0
        
        # Walking characteristics: moderate knee range, rhythmic pattern
        if 20 < knee_range < 60 and knee_variance > 50:
            return 'walking'
        
        # Exercise characteristics: large knee range, high variance
        elif knee_range > 60:
            return 'exercise'
        
        # Static/standing characteristics: small range, low variance
        elif knee_range < 20:
            return 'static'
        
        return 'general'
    
    def _find_walking_key_frames(self, angle_data: list) -> dict:
        """Find key frames specific to walking patterns"""
        key_frames = {}
        
        # Find walking cycle phases
        left_knee_angles = []
        right_knee_angles = []
        
        for frame_data in angle_data:
            angles = frame_data.get('angles', {})
            if 'left_knee_angle' in angles:
                left_knee_angles.append(angles['left_knee_angle'])
            if 'right_knee_angle' in angles:
                right_knee_angles.append(angles['right_knee_angle'])
        
        if left_knee_angles and right_knee_angles:
            # Find heel strike (minimum knee angle)
            min_left_idx = left_knee_angles.index(min(left_knee_angles))
            min_right_idx = right_knee_angles.index(min(right_knee_angles))
            
            key_frames['left_heel_strike'] = {
                'frame': min_left_idx,
                'timestamp': angle_data[min_left_idx].get('timestamp', 0),
                'angle': left_knee_angles[min_left_idx],
                'description': 'Left heel strike - beginning of stance phase'
            }
            
            key_frames['right_heel_strike'] = {
                'frame': min_right_idx,
                'timestamp': angle_data[min_right_idx].get('timestamp', 0),
                'angle': right_knee_angles[min_right_idx],
                'description': 'Right heel strike - beginning of stance phase'
            }
            
            # Find mid-swing (maximum knee angle)
            max_left_idx = left_knee_angles.index(max(left_knee_angles))
            max_right_idx = right_knee_angles.index(max(right_knee_angles))
            
            key_frames['left_mid_swing'] = {
                'frame': max_left_idx,
                'timestamp': angle_data[max_left_idx].get('timestamp', 0),
                'angle': left_knee_angles[max_left_idx],
                'description': 'Left mid-swing - maximum knee flexion'
            }
            
            key_frames['right_mid_swing'] = {
                'frame': max_right_idx,
                'timestamp': angle_data[max_right_idx].get('timestamp', 0),
                'angle': right_knee_angles[max_right_idx],
                'description': 'Right mid-swing - maximum knee flexion'
            }
        
        return key_frames
    
    def _find_exercise_key_frames(self, angle_data: list) -> dict:
        """Find key frames specific to exercise movements"""
        key_frames = {}
        
        min_squat_angle = float('inf')
        max_jump_angle = float('-inf')
        max_elbow_angle = float('-inf')
        
        for frame_data in angle_data:
            angles = frame_data.get('angles', {})
            frame_num = frame_data.get('frame', 0)
            
            # Find lowest squat (minimum knee angle)
            if 'left_knee_angle' in angles and 'right_knee_angle' in angles:
                avg_knee_angle = (angles['left_knee_angle'] + angles['right_knee_angle']) / 2
                if avg_knee_angle < min_squat_angle:
                    min_squat_angle = avg_knee_angle
                    key_frames['lowest_squat'] = {
                        'frame': frame_num,
                        'timestamp': frame_data.get('timestamp', 0),
                        'angle': avg_knee_angle,
                        'description': 'Lowest point in squat movement'
                    }
                
                if avg_knee_angle > max_jump_angle:
                    max_jump_angle = avg_knee_angle
                    key_frames['highest_jump'] = {
                        'frame': frame_num,
                        'timestamp': frame_data.get('timestamp', 0),
                        'angle': avg_knee_angle,
                        'description': 'Highest point in jump movement'
                    }
            
            # Find maximum elbow flexion
            if 'left_elbow_angle' in angles and 'right_elbow_angle' in angles:
                avg_elbow_angle = (angles['left_elbow_angle'] + angles['right_elbow_angle']) / 2
                if avg_elbow_angle > max_elbow_angle:
                    max_elbow_angle = avg_elbow_angle
                    key_frames['max_elbow_flexion'] = {
                        'frame': frame_num,
                        'timestamp': frame_data.get('timestamp', 0),
                        'angle': avg_elbow_angle,
                        'description': 'Maximum elbow flexion'
                    }
        
        return key_frames
    
    def _find_general_key_frames(self, angle_data: list) -> dict:
        """Find general key frames for any movement type"""
        key_frames = {}
        
        max_extension = float('-inf')
        min_extension = float('inf')
        
        for frame_data in angle_data:
            angles = frame_data.get('angles', {})
            frame_num = frame_data.get('frame', 0)
            
            # Find most extended pose (sum of all angles)
            total_extension = sum(angles.values())
            if total_extension > max_extension:
                max_extension = total_extension
                key_frames['most_extended_pose'] = {
                    'frame': frame_num,
                    'timestamp': frame_data.get('timestamp', 0),
                    'total_angle': total_extension,
                    'description': 'Most extended body pose'
                }
            
            if total_extension < min_extension:
                min_extension = total_extension
                key_frames['most_compressed_pose'] = {
                    'frame': frame_num,
                    'timestamp': frame_data.get('timestamp', 0),
                    'total_angle': total_extension,
                    'description': 'Most compressed body pose'
                }
        
        return key_frames

    def _create_angle_summary(self, angle_data: list) -> dict:
        """
        Create summary statistics for angle data
        """
        if not angle_data:
            return {}
        
        # Collect all angle values by type
        angle_values = {}
        for frame_data in angle_data:
            for angle_name, angle_value in frame_data['angles'].items():
                if angle_name not in angle_values:
                    angle_values[angle_name] = []
                angle_values[angle_name].append(angle_value)
        
        # Calculate statistics for each angle
        summary = {}
        for angle_name, values in angle_values.items():
            if values:
                summary[angle_name] = {
                    'mean': np.mean(values),
                    'std': np.std(values),
                    'min': np.min(values),
                    'max': np.max(values),
                    'count': len(values),
                    'range': np.max(values) - np.min(values)
                }
        
        return summary
