import os
import json
import base64
from typing import Dict, List, Optional
from datetime import datetime
import anthropic
from pathlib import Path
from action_logger import action_logger

class TwoStageClaudeAnalyzer:
    """
    Two-stage Claude analysis system:
    1. General movement overview from key frames
    2. Detailed health report with pose data
    """
    
    def __init__(self):
        self.api_key = os.getenv('CLAUDE_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
        self.model = "claude-3-5-sonnet-20241022"
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable not set")
        self.client = anthropic.Anthropic(api_key=self.api_key)
    
    def analyze_video_comprehensive(self, analysis_package: Dict) -> Dict:
        """
        Perform comprehensive two-stage analysis
        """
        start_time = datetime.now()
        video_id = analysis_package.get('video_analysis', {}).get('video_path', 'unknown')
        
        try:
            action_logger.log_processing_step("TWO_STAGE_ANALYSIS_START", video_id, "started")
            print("🔍 Starting two-stage Claude analysis...")
            
            # Stage 1: General movement overview from key frames
            print("📸 Stage 1: Analyzing key frames for movement overview...")
            action_logger.log_processing_step("STAGE_1_MOVEMENT_OVERVIEW", video_id, "started")
            movement_overview = self._analyze_movement_overview(analysis_package)
            action_logger.log_processing_step("STAGE_1_MOVEMENT_OVERVIEW", video_id, "completed")
            
            # Stage 2: Detailed health report with pose data
            print("🦴 Stage 2: Creating detailed health report with pose data...")
            action_logger.log_processing_step("STAGE_2_HEALTH_REPORT", video_id, "started")
            health_report = self._analyze_health_with_pose_data(analysis_package, movement_overview)
            action_logger.log_processing_step("STAGE_2_HEALTH_REPORT", video_id, "completed")
            
            # Combine results
            comprehensive_analysis = {
                'analysis_type': 'two_stage_comprehensive_analysis',
                'timestamp': datetime.now().isoformat(),
                'stage_1_movement_overview': movement_overview,
                'stage_2_health_report': health_report,
                'analysis_summary': self._create_analysis_summary(movement_overview, health_report)
            }
            
            duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            action_logger.log_processing_step("TWO_STAGE_ANALYSIS_COMPLETE", video_id, "completed", 
                                            {"duration_ms": duration_ms, "movement_type": movement_overview.get('movement_type', 'unknown')})
            print("✅ Two-stage analysis completed successfully!")
            return comprehensive_analysis
            
        except Exception as e:
            duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            action_logger.log_error("TWO_STAGE_ANALYSIS_ERROR", str(e), {"video_id": video_id, "duration_ms": duration_ms})
            print(f"❌ Error in comprehensive analysis: {e}")
            return {
                'error': str(e),
                'analysis_type': 'two_stage_comprehensive_analysis',
                'timestamp': datetime.now().isoformat()
            }
    
    def _analyze_movement_overview(self, analysis_package: Dict) -> Dict:
        """
        Stage 1: Analyze key frames to determine movement type and general overview
        """
        try:
            key_frames = analysis_package.get('key_frames', [])
            video_info = analysis_package.get('video_analysis', {})
            
            # Prepare key frame data for Claude
            key_frame_data = []
            for i, frame in enumerate(key_frames):
                frame_data = {
                    'frame_number': frame.get('frame_number', 0),
                    'timestamp': frame.get('timestamp', 0),
                    'interval': frame.get('interval', ''),
                    'has_pose_data': frame.get('has_pose_data', False)
                }
                
                # Add pose data if available
                if frame.get('pose_data'):
                    frame_data['pose_data'] = frame['pose_data']
                
                key_frame_data.append(frame_data)
            
            # Create prompt for movement overview
            prompt = self._create_movement_overview_prompt(video_info, key_frame_data)
            
            # Call Claude API
            response = self._call_claude_api(prompt, "movement_overview")
            
            # Parse response
            movement_overview = self._parse_movement_overview_response(response)
            
            return movement_overview
            
        except Exception as e:
            print(f"❌ Error in movement overview analysis: {e}")
            return {
                'error': str(e),
                'movement_type': 'unknown',
                'confidence': 0.0
            }
    
    def _analyze_health_with_pose_data(self, analysis_package: Dict, movement_overview: Dict) -> Dict:
        """
        Stage 2: Create detailed health report using pose data and movement overview
        """
        try:
            key_frames = analysis_package.get('key_frames', [])
            pose_analysis = analysis_package.get('pose_analysis', {})
            video_info = analysis_package.get('video_analysis', {})
            
            # Extract movement type from stage 1
            movement_type = movement_overview.get('movement_type', 'unknown')
            movement_confidence = movement_overview.get('confidence', 0.0)
            
            # Create detailed prompt with pose data
            prompt = self._create_health_analysis_prompt(
                video_info, 
                key_frames, 
                pose_analysis, 
                movement_type, 
                movement_confidence
            )
            
            # Call Claude API
            response = self._call_claude_api(prompt, "health_analysis")
            
            # Parse response
            health_report = self._parse_health_report_response(response)
            
            return health_report
            
        except Exception as e:
            print(f"❌ Error in health analysis: {e}")
            return {
                'error': str(e),
                'overall_assessment': 'Analysis failed due to technical error'
            }
    
    def _create_movement_overview_prompt(self, video_info: Dict, key_frames: List[Dict]) -> str:
        """
        Create prompt for movement overview analysis with images
        """
        # Prepare image data for Claude
        image_content = []
        for i, frame in enumerate(key_frames):
            if frame.get('image_encoded') and frame.get('image_base64'):
                image_content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": frame['image_base64']
                    }
                })
        
        # Create text content
        text_content = f"""You are an expert physical therapist and movement analysis specialist. Please analyze the following video key frames to determine the type of movement being performed.

VIDEO INFORMATION:
- Duration: {video_info.get('duration', 0):.1f} seconds
- Total frames: {video_info.get('total_frames', 0)}
- FPS: {video_info.get('fps', 0):.1f}

KEY FRAMES ANALYSIS:
I've extracted 5 key frames from different intervals of the video. Please analyze these frames to determine:

1. What type of movement is being performed?
2. What is the quality and technique of the movement?
3. Are there any obvious issues or concerns?
4. What is the overall assessment of the movement?

KEY FRAMES DATA:
{json.dumps([{k: v for k, v in frame.items() if k != 'image_base64'} for frame in key_frames], indent=2)}

Please provide your analysis in the following JSON format:
{{
    "movement_type": "walking|squatting|jumping|standing|running|other",
    "confidence": 0.0-1.0,
    "movement_description": "Brief description of what you observe",
    "technique_quality": "excellent|good|fair|poor",
    "key_observations": [
        "List of key observations from the frames"
    ],
    "obvious_concerns": [
        "List any obvious concerns or issues"
    ],
    "overall_assessment": "Overall assessment of the movement",
    "recommendations": [
        "General recommendations based on visual analysis"
    ]
}}

Focus on:
- Identifying the primary movement pattern
- Assessing movement quality and technique
- Noting any obvious postural or movement issues
- Providing general recommendations

Be thorough but concise in your analysis."""
        
        # Combine text and images
        content = [{"type": "text", "text": text_content}] + image_content
        
        return content
    
    def _create_health_analysis_prompt(self, video_info: Dict, key_frames: List[Dict], 
                                     pose_analysis: Dict, movement_type: str, confidence: float) -> str:
        """
        Create prompt for detailed health analysis with comprehensive pose data
        """
        # Prepare detailed pose data for each key frame
        detailed_key_frames = []
        for frame in key_frames:
            frame_data = {
                'frame_number': frame.get('frame_number', 0),
                'timestamp': frame.get('timestamp', 0),
                'interval': frame.get('interval', ''),
                'has_pose_data': frame.get('has_pose_data', False)
            }
            
            # Add detailed pose data if available
            if frame.get('pose_data'):
                pose_data = frame['pose_data']
                frame_data['pose_analysis'] = {
                    'angles': pose_data.get('angles', {}),
                    'landmarks_2d': pose_data.get('landmarks_2d', {}),
                    'landmarks_3d': pose_data.get('landmarks_3d', {}),
                    'visibility': pose_data.get('visibility', {})
                }
            
            detailed_key_frames.append(frame_data)
        
        # Create comprehensive angle analysis
        angle_analysis = self._create_comprehensive_angle_analysis(pose_analysis.get('angle_summary', {}))
        
        prompt = f"""You are an expert physical therapist and biomechanics specialist. Based on the movement overview and detailed pose data, please provide a comprehensive health analysis.

MOVEMENT OVERVIEW:
- Movement Type: {movement_type}
- Confidence: {confidence:.2f}

VIDEO INFORMATION:
- Duration: {video_info.get('duration', 0):.1f} seconds
- Total frames: {video_info.get('total_frames', 0)}

POSE ANALYSIS DATA:
- Total pose frames analyzed: {pose_analysis.get('total_pose_frames', 0)}
- Pose data available: {pose_analysis.get('pose_data_available', False)}

COMPREHENSIVE ANGLE ANALYSIS:
{json.dumps(angle_analysis, indent=2)}

DETAILED KEY FRAMES WITH POSE DATA:
{json.dumps(detailed_key_frames, indent=2)}

Please provide a comprehensive health analysis in the following JSON format:
{{
    "overall_assessment": "Comprehensive assessment of the patient's movement and health",
    "movement_analysis": {{
        "movement_type": "{movement_type}",
        "technique_quality": "excellent|good|fair|poor",
        "movement_efficiency": "high|medium|low",
        "key_findings": [
            "Key findings about the movement"
        ],
        "concerns": [
            "Specific movement concerns"
        ],
        "recommendations": [
            "Movement-specific recommendations"
        ]
    }},
    "biomechanical_analysis": {{
        "joint_analysis": {{
            "knee": "Analysis of knee movement and angles",
            "hip": "Analysis of hip movement and angles",
            "ankle": "Analysis of ankle movement and angles",
            "spine": "Analysis of spine alignment and movement",
            "overall": "Overall biomechanical assessment"
        }},
        "posture_assessment": "Assessment of posture and alignment",
        "movement_patterns": "Analysis of movement patterns and coordination",
        "asymmetries": "Identification of any asymmetries or imbalances"
    }},
    "health_insights": {{
        "strengths": [
            "Identified strengths in movement"
        ],
        "areas_for_improvement": [
            "Areas that need improvement"
        ],
        "risk_factors": [
            "Potential risk factors for injury"
        ],
        "positive_findings": [
            "Positive aspects of the movement"
        ]
    }},
    "recommendations": {{
        "immediate_actions": [
            "Immediate actions to take"
        ],
        "long_term_goals": [
            "Long-term improvement goals"
        ],
        "exercises": [
            "Recommended exercises"
        ],
        "precautions": [
            "Precautions to take"
        ]
    }},
    "follow_up": {{
        "next_steps": [
            "Recommended next steps"
        ],
        "monitoring": [
            "What to monitor"
        ],
        "when_to_seek_help": "When to seek professional help"
    }}
}}

Focus on:
- Providing specific, actionable insights based on the pose data
- Identifying potential health concerns or risk factors
- Giving practical recommendations for improvement
- Being thorough but accessible in your analysis

This is a comprehensive health analysis, so be detailed and professional in your assessment."""
        
        return prompt
    
    def _call_claude_api(self, prompt, prompt_type: str = "unknown") -> Dict:
        """
        Call Claude API with the given prompt (can be string or list with images)
        """
        start_time = datetime.now()
        
        try:
            # Log prompt details
            if isinstance(prompt, list):
                prompt_content = str(prompt)
                action_logger.log_prompt_sent(f"{prompt_type}_multimodal", prompt_content, self.model)
                # Multi-modal content with images
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=4000,
                    messages=[{"role": "user", "content": prompt}]
                )
            else:
                prompt_content = prompt
                action_logger.log_prompt_sent(f"{prompt_type}_text", prompt_content, self.model)
                # Text-only content
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=4000,
                    messages=[{"role": "user", "content": prompt}]
                )
            
            response_text = message.content[0].text
            duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            
            # Log response details
            action_logger.log_response_received(f"{prompt_type}_response", response_text, self.model)
            action_logger.log_claude_call(
                prompt_type=prompt_type,
                prompt_length=len(prompt_content),
                response_length=len(response_text),
                duration_ms=duration_ms,
                model=self.model,
                success=True
            )
            
            return {"content": [{"text": response_text}]}
        except Exception as e:
            duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            action_logger.log_claude_call(
                prompt_type=prompt_type,
                prompt_length=len(str(prompt)),
                response_length=0,
                duration_ms=duration_ms,
                model=self.model,
                success=False,
                error=str(e)
            )
            raise Exception(f"Claude API call failed: {str(e)}")
    
    def _create_comprehensive_angle_analysis(self, angle_summary: Dict) -> Dict:
        """
        Create comprehensive angle analysis for Claude
        """
        analysis = {
            'joint_angles': {},
            'movement_patterns': {},
            'health_indicators': {},
            'recommendations': []
        }
        
        # Analyze each joint angle
        for angle_name, stats in angle_summary.items():
            joint_name = angle_name.replace('_angle', '').replace('_', ' ').title()
            
            # Determine health status based on angle ranges
            mean_angle = stats.get('mean', 0)
            angle_range = stats.get('range', 0)
            std_dev = stats.get('std', 0)
            
            # Movement-specific analysis
            if 'knee' in angle_name.lower():
                if mean_angle < 90:
                    health_status = 'excellent' if angle_range < 30 else 'good'
                    movement_phase = 'deep flexion'
                elif mean_angle < 120:
                    health_status = 'good' if angle_range < 40 else 'fair'
                    movement_phase = 'moderate flexion'
                else:
                    health_status = 'fair' if angle_range < 50 else 'poor'
                    movement_phase = 'minimal flexion'
            elif 'hip' in angle_name.lower():
                if mean_angle < 100:
                    health_status = 'excellent' if angle_range < 25 else 'good'
                    movement_phase = 'deep hip flexion'
                elif mean_angle < 140:
                    health_status = 'good' if angle_range < 35 else 'fair'
                    movement_phase = 'moderate hip flexion'
                else:
                    health_status = 'fair' if angle_range < 45 else 'poor'
                    movement_phase = 'minimal hip flexion'
            else:
                health_status = 'good' if std_dev < 20 else 'fair'
                movement_phase = 'stable'
            
            analysis['joint_angles'][angle_name] = {
                'joint_name': joint_name,
                'mean_angle': mean_angle,
                'angle_range': angle_range,
                'std_deviation': std_dev,
                'health_status': health_status,
                'movement_phase': movement_phase,
                'stability': 'high' if std_dev < 15 else 'medium' if std_dev < 30 else 'low'
            }
        
        # Overall movement pattern analysis
        knee_angles = [v for k, v in angle_summary.items() if 'knee' in k.lower()]
        hip_angles = [v for k, v in angle_summary.items() if 'hip' in k.lower()]
        
        if knee_angles and hip_angles:
            avg_knee_range = sum(k['range'] for k in knee_angles) / len(knee_angles)
            avg_hip_range = sum(h['range'] for h in hip_angles) / len(hip_angles)
            
            if avg_knee_range > 80 and avg_hip_range > 60:
                movement_type = 'squatting'
                quality = 'excellent' if avg_knee_range > 100 else 'good'
            elif avg_knee_range > 40 and avg_hip_range > 30:
                movement_type = 'walking'
                quality = 'good' if avg_knee_range > 60 else 'fair'
            else:
                movement_type = 'standing'
                quality = 'excellent' if avg_knee_range < 20 else 'good'
            
            analysis['movement_patterns'] = {
                'detected_movement': movement_type,
                'quality': quality,
                'knee_mobility': avg_knee_range,
                'hip_mobility': avg_hip_range,
                'coordination': 'excellent' if abs(avg_knee_range - avg_hip_range) < 20 else 'good'
            }
        
        return analysis
    
    def _parse_movement_overview_response(self, response: Dict) -> Dict:
        """
        Parse Claude's response for movement overview
        """
        try:
            content = response.get('content', [{}])[0].get('text', '{}')
            
            # Try to extract JSON from the response
            if '```json' in content:
                json_start = content.find('```json') + 7
                json_end = content.find('```', json_start)
                json_str = content[json_start:json_end].strip()
            elif '{' in content and '}' in content:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                json_str = content[json_start:json_end]
            else:
                # Fallback: create basic response
                return {
                    'movement_type': 'unknown',
                    'confidence': 0.0,
                    'movement_description': 'Unable to parse response',
                    'technique_quality': 'unknown',
                    'key_observations': [],
                    'obvious_concerns': [],
                    'overall_assessment': 'Analysis failed',
                    'recommendations': []
                }
            
            return json.loads(json_str)
            
        except Exception as e:
            print(f"❌ Error parsing movement overview response: {e}")
            return {
                'movement_type': 'unknown',
                'confidence': 0.0,
                'movement_description': f'Parse error: {str(e)}',
                'technique_quality': 'unknown',
                'key_observations': [],
                'obvious_concerns': [],
                'overall_assessment': 'Analysis failed',
                'recommendations': []
            }
    
    def _parse_health_report_response(self, response: Dict) -> Dict:
        """
        Parse Claude's response for health report
        """
        try:
            content = response.get('content', [{}])[0].get('text', '{}')
            
            # Try to extract JSON from the response
            if '```json' in content:
                json_start = content.find('```json') + 7
                json_end = content.find('```', json_start)
                json_str = content[json_start:json_end].strip()
            elif '{' in content and '}' in content:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                json_str = content[json_start:json_end]
            else:
                # Fallback: create basic response
                return {
                    'overall_assessment': 'Unable to parse response',
                    'movement_analysis': {},
                    'biomechanical_analysis': {},
                    'health_insights': {},
                    'recommendations': {},
                    'follow_up': {}
                }
            
            return json.loads(json_str)
            
        except Exception as e:
            print(f"❌ Error parsing health report response: {e}")
            return {
                'overall_assessment': f'Parse error: {str(e)}',
                'movement_analysis': {},
                'biomechanical_analysis': {},
                'health_insights': {},
                'recommendations': {},
                'follow_up': {}
            }
    
    def _create_analysis_summary(self, movement_overview: Dict, health_report: Dict) -> Dict:
        """
        Create a summary of the two-stage analysis
        """
        return {
            'movement_identified': movement_overview.get('movement_type', 'unknown'),
            'confidence_level': movement_overview.get('confidence', 0.0),
            'technique_quality': movement_overview.get('technique_quality', 'unknown'),
            'overall_health_assessment': health_report.get('overall_assessment', 'Not available'),
            'key_concerns': health_report.get('health_insights', {}).get('risk_factors', []),
            'main_recommendations': health_report.get('recommendations', {}).get('immediate_actions', []),
            'analysis_quality': 'high' if movement_overview.get('confidence', 0) > 0.7 else 'medium'
        }

# Example usage
if __name__ == "__main__":
    analyzer = TwoStageClaudeAnalyzer()
    print("Two-stage Claude analyzer initialized successfully!")
