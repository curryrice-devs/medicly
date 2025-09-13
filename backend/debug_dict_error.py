#!/usr/bin/env python3

import json
import os
import traceback
from two_stage_claude_analyzer import TwoStageClaudeAnalyzer

# Set dummy API key for testing
os.environ['CLAUDE_API_KEY'] = 'dummy-key-for-testing'

def test_angle_summary_processing():
    """Test the angle summary processing that might cause the unhashable dict error"""
    
    # Create sample angle summary data similar to what key_frame_extractor produces
    sample_angle_summary = {
        'left_knee_angle': {
            'mean': 120.5,
            'std': 15.2,
            'min': 90.0,
            'max': 160.0,
            'range': 70.0,
            'count': 50
        },
        'right_knee_angle': {
            'mean': 118.3,
            'std': 12.8,
            'min': 95.0,
            'max': 155.0,
            'range': 60.0,
            'count': 50
        },
        'left_hip_angle': {
            'mean': 95.2,
            'std': 18.5,
            'min': 60.0,
            'max': 140.0,
            'range': 80.0,
            'count': 50
        },
        'right_hip_angle': {
            'mean': 98.1,
            'std': 16.3,
            'min': 65.0,
            'max': 135.0,
            'range': 70.0,
            'count': 50
        }
    }
    
    analyzer = TwoStageClaudeAnalyzer()
    
    try:
        print("Testing _create_comprehensive_angle_analysis...")
        result = analyzer._create_comprehensive_angle_analysis(sample_angle_summary)
        print("✅ _create_comprehensive_angle_analysis completed successfully")
        print(f"Result keys: {result.keys()}")
        
        # Test JSON serialization
        print("Testing JSON serialization...")
        json_result = json.dumps(result, indent=2)
        print("✅ JSON serialization successful")
        
        return result
        
    except Exception as e:
        print(f"❌ Error in _create_comprehensive_angle_analysis: {e}")
        print("Traceback:")
        traceback.print_exc()
        return None

def test_structured_analysis():
    """Test the structured analysis that's causing the error"""
    
    # Create sample analysis package
    sample_analysis_package = {
        'video_analysis': {
            'duration': 16.2,
            'total_frames': 486,
            'fps': 30.0,
            'video_path': 'test_video.mp4'
        },
        'key_frames': [
            {
                'frame_number': 96,
                'timestamp': 3.2,
                'interval': 'beginning',
                'has_pose_data': True,
                'pose_data': {
                    'angles': {
                        'left_knee_angle': 120.5,
                        'right_knee_angle': 118.3
                    }
                }
            }
        ],
        'pose_analysis': {
            'total_pose_frames': 50,
            'pose_data_available': True,
            'angle_summary': {
                'left_knee_angle': {
                    'mean': 120.5,
                    'std': 15.2,
                    'min': 90.0,
                    'max': 160.0,
                    'range': 70.0,
                    'count': 50
                },
                'right_knee_angle': {
                    'mean': 118.3,
                    'std': 12.8,
                    'min': 95.0,
                    'max': 155.0,
                    'range': 60.0,
                    'count': 50
                }
            }
        }
    }
    
    analyzer = TwoStageClaudeAnalyzer()
    
    try:
        print("Testing _create_structured_analysis_prompt...")
        prompt = analyzer._create_structured_analysis_prompt(
            sample_analysis_package['video_analysis'],
            sample_analysis_package['key_frames'],
            sample_analysis_package['pose_analysis']
        )
        print("✅ _create_structured_analysis_prompt completed successfully")
        print(f"Prompt type: {type(prompt)}")
        
        return prompt
        
    except Exception as e:
        print(f"❌ Error in _create_structured_analysis_prompt: {e}")
        print("Traceback:")
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("🔍 Debugging unhashable dict error...")
    
    # Test 1: Angle summary processing
    print("\n" + "="*50)
    print("TEST 1: Angle Summary Processing")
    print("="*50)
    result1 = test_angle_summary_processing()
    
    # Test 2: Structured analysis prompt
    print("\n" + "="*50)  
    print("TEST 2: Structured Analysis Prompt")
    print("="*50)
    result2 = test_structured_analysis()
    
    print("\n🔍 Debug test completed!") 