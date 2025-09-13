from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from typing import Optional
import base64
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from simple_processor import SimpleProcessor
from key_frame_extractor import KeyFrameExtractor
from two_stage_claude_analyzer import TwoStageClaudeAnalyzer
from action_logger import action_logger
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Video Analysis API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Global processor and thread pool
processor = SimpleProcessor()
key_frame_extractor = KeyFrameExtractor()
two_stage_claude_analyzer = TwoStageClaudeAnalyzer()
executor = ThreadPoolExecutor(max_workers=2)

# In-memory storage for processing status
processing_status = {}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Simple MediaPipe Pose API"}

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload video file and return video ID"""
    try:
        # Generate unique video ID
        video_id = str(uuid.uuid4())
        
        # Save uploaded file
        file_path = UPLOAD_DIR / f"{video_id}.mp4"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Video uploaded: {video_id}")
        action_logger.log_file_operation("UPLOAD", file_path, True, len(content))
        
        return {
            "success": True,
            "video_id": video_id,
            "filename": file.filename,
            "size": len(content)
        }
        
    except Exception as e:
        logger.error(f"Error uploading video: {e}")
        action_logger.log_error("UPLOAD_FAILED", str(e), {"filename": file.filename})
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/process/{video_id}")
async def process_video(video_id: str):
    """Start MediaPipe processing for uploaded video"""
    try:
        # Check if video exists
        video_path = UPLOAD_DIR / f"{video_id}.mp4"
        if not video_path.exists():
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if already processing
        if video_id in processing_status and processing_status[video_id]["status"] == "processing":
            return {"message": "Video is already being processed"}
        
        # Set processing status
        processing_status[video_id] = {
            "status": "processing",
            "message": "Processing started",
            "start_time": datetime.now().isoformat()
        }
        
        # Start processing in background
        def process_video_task():
            try:
                logger.info(f"Starting processing for video {video_id}")
                action_logger.log_processing_step("VIDEO_PROCESSING", video_id, "started")
                
                # Process video
                output_file_path = OUTPUT_DIR / f"{video_id}_output.mp4"
                success, actual_output_path = processor.process_video(str(video_path), str(output_file_path))
                
                # Update status
                if success:
                    processing_status[video_id] = {
                        "status": "completed",
                        "message": "Processing completed successfully",
                        "output_path": actual_output_path,
                        "end_time": datetime.now().isoformat()
                    }
                else:
                    processing_status[video_id] = {
                        "status": "error",
                        "message": "Processing failed",
                        "end_time": datetime.now().isoformat()
                    }
                
                action_logger.log_processing_step("VIDEO_PROCESSING", video_id, "completed")
                logger.info(f"Processing completed for video {video_id}")
                
            except Exception as e:
                logger.error(f"Error processing video {video_id}: {e}")
                processing_status[video_id] = {
                    "status": "error",
                    "message": f"Processing failed: {str(e)}",
                    "end_time": datetime.now().isoformat()
                }
                action_logger.log_error("VIDEO_PROCESSING_FAILED", str(e), {"video_id": video_id})
        
        # Submit to thread pool
        executor.submit(process_video_task)
        
        return {
            "success": True,
            "video_id": video_id,
            "message": "Processing started"
        }
        
    except Exception as e:
        logger.error(f"Error starting video processing: {e}")
        action_logger.log_error("PROCESSING_START_FAILED", str(e), {"video_id": video_id})
        raise HTTPException(status_code=500, detail=f"Failed to start processing: {str(e)}")

@app.get("/api/status/{video_id}")
async def get_processing_status(video_id: str):
    """Get processing status for video"""
    if video_id not in processing_status:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return processing_status[video_id]

@app.get("/api/download/{video_id}")
@app.head("/api/download/{video_id}")
async def download_processed_video(video_id: str):
    """Download processed video file"""
    processed_path = OUTPUT_DIR / f"{video_id}_output.mp4"
    
    if not processed_path.exists():
        raise HTTPException(status_code=404, detail="Processed video not found")
    
    return FileResponse(
        path=str(processed_path),
        media_type="video/mp4",
        filename=f"{video_id}_processed.mp4"
    )

@app.get("/api/stream/{video_id}")
@app.options("/api/stream/{video_id}")
async def stream_processed_video(video_id: str, request: Request):
    """Stream processed video with pose landmarks"""
    
    # Handle OPTIONS request for CORS
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    processed_path = OUTPUT_DIR / f"{video_id}_output.mp4"
    
    if not processed_path.exists():
        raise HTTPException(status_code=404, detail="Processed video not found")
    
    def iterfile():
        with open(processed_path, mode="rb") as file_like:
            yield from file_like
    
    return StreamingResponse(
        iterfile(),
        media_type="video/mp4",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(processed_path.stat().st_size),
            "Access-Control-Allow-Origin": "*",
        }
    )

@app.get("/api/video/{video_id}")
@app.head("/api/video/{video_id}")
@app.options("/api/video/{video_id}")
async def get_original_video(video_id: str, request: Request):
    """Get original video file"""
    
    # Handle OPTIONS request for CORS
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    video_path = UPLOAD_DIR / f"{video_id}.mp4"
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"{video_id}.mp4",
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.get("/api/version")
async def get_version_info():
    """Get version information for all libraries"""
    try:
        version_info = {
            "api_version": "1.0.0",
            "libraries": {
                "mediapipe": "0.10.7",
                "opencv": "4.11.0",
                "numpy": "1.24.3",
                "fastapi": "0.104.1"
            }
        }
        
        return version_info
        
    except Exception as e:
        logger.error(f"Error getting version info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get version info: {str(e)}")

@app.get("/api/angle-data/{video_id}")
async def get_angle_data(video_id: str):
    """Get angle data for a processed video"""
    angle_file_path = OUTPUT_DIR / f"{video_id}_output_angles.json"
    
    if not angle_file_path.exists():
        raise HTTPException(status_code=404, detail="Angle data not found")
    
    return FileResponse(
        path=str(angle_file_path),
        media_type="application/json",
        filename=angle_file_path.name
    )


@app.post("/api/analyze-patient-model")
async def analyze_patient_model(request: Request):
    """Analyze patient pain points and suggest appropriate BioDigital model and movements"""
    try:
        body = await request.json()
        problematic_areas = body.get('problematicAreas', [])
        patient_info = body.get('patientInfo', {})
        
        if not problematic_areas:
            raise HTTPException(status_code=400, detail="No problematic areas provided")
        
        # Create analysis package for Claude
        analysis_package = {
            'patient_info': patient_info,
            'problematic_areas': problematic_areas,
            'analysis_type': 'model_selection'
        }
        
        # Use Claude to analyze and suggest model
        result = await asyncio.get_event_loop().run_in_executor(
            executor, 
            two_stage_claude_analyzer.analyze_patient_model_selection,
            analysis_package
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing patient model: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
@app.post("/api/process-supabase-video")
async def process_supabase_video(request: Request):
    """Download video from Supabase, process it, and upload results back to Supabase"""
    try:
        body = await request.json()
        video_id = body.get('video_id')
        video_url = body.get('video_url')  # Signed URL from Supabase
        storage_path = body.get('storage_path')
        session_id = body.get('session_id')
        
        if not all([video_id, video_url]):
            raise HTTPException(status_code=400, detail="Missing required fields: video_id, video_url")
        
        logger.info(f"Processing Supabase video: {video_id}")
        
        # Step 1: Download video from Supabase to local temp file
        import requests
        video_response = requests.get(video_url)
        if video_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download video from Supabase")
        
        # Save to local temp file for processing
        temp_video_path = UPLOAD_DIR / f"{video_id}.mp4"
        with open(temp_video_path, 'wb') as f:
            f.write(video_response.content)
        
        logger.info(f"Downloaded video to: {temp_video_path}")
        
        # Step 2: Process video locally (existing pipeline)
        processing_status[video_id] = {
            "status": "processing",
            "message": "Processing started",
            "start_time": datetime.now().isoformat()
        }
        
        def process_and_upload_task():
            try:
                import requests
                import os
                from pathlib import Path
                
                logger.info(f"Starting processing for Supabase video {video_id}")
                
                # Process video with MediaPipe
                output_file_path = OUTPUT_DIR / f"{video_id}_output.mp4"
                success, actual_output_path = processor.process_video(str(temp_video_path), str(output_file_path))
                
                # Step 3: Upload processed video back to Supabase
                processed_video_path = Path(actual_output_path) if success else OUTPUT_DIR / f"{video_id}_output.mp4"
                
                if success and processed_video_path.exists():
                    # Upload processed video to Supabase bucket
                    try:
                        
                        # Read processed video file
                        with open(processed_video_path, 'rb') as video_file:
                            video_data = video_file.read()
                        
                        # Create storage path for processed video
                        # Extract user_id from original storage_path if available
                        user_id = storage_path.split('/')[0] if storage_path else 'unknown'
                        # Store processed videos in a separate path to distinguish from originals
                        processed_storage_path = f"processed/{user_id}/sessions/{session_id}/{video_id}_processed.mp4"
                        
                        logger.info(f"Uploading processed video to Supabase: {processed_storage_path}")
                        
                        # Upload to Supabase storage using direct API
                        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
                        supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
                        
                        logger.info(f"Supabase credentials check - URL: {'SET' if supabase_url else 'MISSING'}, Key: {'SET' if supabase_key else 'MISSING'}")
                        
                        if supabase_url and supabase_key:
                            # Upload to processed_videos bucket instead of patient_videos
                            upload_url = f"{supabase_url}/storage/v1/object/processed_videos/{processed_storage_path}"
                            logger.info(f"Attempting upload to: {upload_url}")
                            logger.info(f"Video file size: {len(video_data)} bytes")
                            
                            upload_response = requests.post(
                                upload_url,
                                headers={
                                    'apikey': supabase_key,
                                    'Authorization': f'Bearer {supabase_key}',
                                    'Content-Type': 'video/mp4'
                                },
                                data=video_data
                            )
                            
                            logger.info(f"Upload response: {upload_response.status_code} - {upload_response.text[:200]}")
                            
                            if upload_response.status_code == 200:
                                logger.info(f"Processed video uploaded successfully to: {processed_storage_path}")
                                
                                # Create signed URL for the processed video
                                try:
                                    from supabase import create_client
                                    supabase_client = create_client(supabase_url, supabase_key)
                                    
                                    logger.info(f"Creating signed URL for: {processed_storage_path}")
                                    # Create signed URL from processed_videos bucket
                                    signed_url_result = supabase_client.storage.from_('processed_videos').create_signed_url(
                                        processed_storage_path, 
                                        60 * 60 * 24  # 24 hours
                                    )
                                    
                                    logger.info(f"Signed URL result type: {type(signed_url_result)}")
                                    logger.info(f"Signed URL result: {signed_url_result}")
                                    
                                    # Handle different response formats
                                    if hasattr(signed_url_result, 'data') and signed_url_result.data:
                                        # New format: result.data.signed_url
                                        if hasattr(signed_url_result.data, 'signed_url'):
                                            processed_video_url = signed_url_result.data.signed_url
                                        # Old format: result.data['signedUrl']
                                        elif isinstance(signed_url_result.data, dict) and 'signedUrl' in signed_url_result.data:
                                            processed_video_url = signed_url_result.data['signedUrl']
                                        else:
                                            logger.warn(f"Unexpected signed URL data format: {signed_url_result.data}")
                                            processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                                    elif isinstance(signed_url_result, dict):
                                        # Direct dict format - this is what we're getting
                                        if 'signedUrl' in signed_url_result:
                                            processed_video_url = signed_url_result['signedUrl']
                                            logger.info(f"Using signedUrl from direct dict response")
                                        elif 'signedURL' in signed_url_result:
                                            processed_video_url = signed_url_result['signedURL'] 
                                            logger.info(f"Using signedURL from direct dict response")
                                        elif 'data' in signed_url_result and 'signedUrl' in signed_url_result['data']:
                                            processed_video_url = signed_url_result['data']['signedUrl']
                                            logger.info(f"Using nested data.signedUrl from dict response")
                                        else:
                                            logger.warn(f"No signedUrl in response: {signed_url_result}")
                                            processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                                    else:
                                        logger.warn(f"Unexpected signed URL response format: {signed_url_result}")
                                        processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                                    
                                    logger.info(f"Final processed video URL: {processed_video_url}")
                                    
                                except Exception as signed_url_error:
                                    logger.error(f"Error creating signed URL: {signed_url_error}")
                                    processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                            else:
                                logger.warn(f"Failed to upload processed video to Supabase: {upload_response.status_code} - {upload_response.text}")
                                processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                        else:
                            logger.warn("Missing Supabase credentials, using backend stream")
                            processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                            
                    except Exception as upload_error:
                        logger.error(f"Error uploading processed video to Supabase: {upload_error}")
                        processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                    
                    # Update session with processed video URL (postvidurl)
                    if session_id:
                        try:
                            session_update = requests.put(
                                f"http://localhost:3000/api/sessions/{session_id}",
                                json={"postvidurl": processed_video_url},
                                headers={"Content-Type": "application/json"}
                            )
                            if session_update.status_code == 200:
                                logger.info(f"Updated session {session_id} with processed video URL")
                            else:
                                logger.warn(f"Failed to update session {session_id}: {session_update.text}")
                        except Exception as e:
                            logger.warn(f"Error updating session with processed video URL: {e}")
                else:
                    processed_video_url = f"http://localhost:8001/api/stream/{video_id}"
                    logger.warn("Processed video file not found, using backend stream")
                
                # Update status with URLs
                processing_status[video_id] = {
                    "status": "completed",
                    "message": "Processing completed successfully",
                    "original_url": video_url,
                    "processed_video_url": processed_video_url,
                    "output_path": str(actual_output_path) if success else None,
                    "end_time": datetime.now().isoformat()
                }
                
                logger.info(f"Processing completed for Supabase video {video_id}")
                
            except Exception as e:
                logger.error(f"Error processing Supabase video {video_id}: {e}")
                processing_status[video_id] = {
                    "status": "error",
                    "message": f"Processing failed: {str(e)}",
                    "end_time": datetime.now().isoformat()
                }
        
        # Start processing in background
        executor.submit(process_and_upload_task)
        
        return {
            "success": True,
            "video_id": video_id,
            "message": "Supabase video processing started",
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Error starting Supabase video processing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start Supabase video processing: {str(e)}")

@app.post("/api/two-stage-analysis/{video_id}")
async def perform_two_stage_analysis(video_id: str):
    """Perform comprehensive two-stage Claude analysis with key frames and pose data"""
    start_time = datetime.now()
    
    try:
        # Check if video exists
        video_path = UPLOAD_DIR / f"{video_id}.mp4"
        if not video_path.exists():
            action_logger.log_error("VIDEO_NOT_FOUND", f"Video {video_id} not found", {"video_id": video_id})
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if angle data exists
        angle_file = OUTPUT_DIR / f"{video_id}_output_angles.json"
        if not angle_file.exists():
            action_logger.log_error("ANGLE_DATA_NOT_FOUND", f"Angle data for {video_id} not found", {"video_id": video_id})
            raise HTTPException(status_code=404, detail="Angle data not found. Please process the video first.")
        
        # Log file operations
        action_logger.log_file_operation("READ", angle_file, True, angle_file.stat().st_size)
        
        # Create key frames directory
        key_frames_dir = OUTPUT_DIR / f"{video_id}_key_frames"
        key_frames_dir.mkdir(exist_ok=True)
        action_logger.log_file_operation("CREATE_DIR", key_frames_dir, True)
        
        # Load angle data
        with open(angle_file, 'r') as f:
            angle_data_raw = json.load(f)
        
        angle_data = angle_data_raw.get('angle_data', [])
        
        # Extract key frames with pose data
        action_logger.log_processing_step("KEY_FRAME_EXTRACTION", video_id, "started")
        analysis_package = key_frame_extractor.create_analysis_package(
            str(video_path), 
            angle_data,
            str(key_frames_dir)
        )
        action_logger.log_processing_step("KEY_FRAME_EXTRACTION", video_id, "completed")
        
        if analysis_package.get('error'):
            action_logger.log_error("KEY_FRAME_EXTRACTION_FAILED", analysis_package['error'], {"video_id": video_id})
            raise HTTPException(status_code=500, detail=f"Key frame extraction failed: {analysis_package['error']}")
        
        # Perform two-stage analysis
        analysis_result = two_stage_claude_analyzer.analyze_video_comprehensive(
            analysis_package
        )
        
        # Save analysis result
        analysis_file = OUTPUT_DIR / f"{video_id}_two_stage_analysis.json"
        with open(analysis_file, 'w') as f:
            json.dump(analysis_result, f, indent=2)
        
        action_logger.log_file_operation("WRITE", analysis_file, True, analysis_file.stat().st_size)
        
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        action_logger.log_api_call("POST", f"/api/two-stage-analysis/{video_id}", 200, duration_ms, 
                                 {"video_id": video_id, "key_frames_count": len(analysis_package.get('key_frames', []))})
        
        return {
            "success": True,
            "video_id": video_id,
            "analysis": analysis_result,
            "key_frames": analysis_package.get('key_frames', []),
            "message": "Two-stage analysis completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        action_logger.log_api_call("POST", f"/api/two-stage-analysis/{video_id}", 500, duration_ms, 
                                 {"video_id": video_id, "error": str(e)})
        action_logger.log_error("TWO_STAGE_ANALYSIS_API_ERROR", str(e), {"video_id": video_id})
        logger.error(f"Error performing two-stage analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Two-stage analysis failed: {str(e)}")

@app.get("/api/two-stage-analysis/{video_id}")
async def get_two_stage_analysis(video_id: str):
    """Get two-stage analysis results"""
    try:
        analysis_file = OUTPUT_DIR / f"{video_id}_two_stage_analysis.json"
        
        if not analysis_file.exists():
            raise HTTPException(status_code=404, detail="Two-stage analysis not found. Please run analysis first.")
        
        with open(analysis_file, 'r') as f:
            analysis_data = json.load(f)
        
        return {
            "success": True,
            "video_id": video_id,
            "analysis": analysis_data
        }
        
    except Exception as e:
        logger.error(f"Error getting two-stage analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get two-stage analysis: {str(e)}")

@app.get("/api/processed-video/{video_id}")
async def get_processed_video_data(video_id: str):
    """Return processed video as base64 data for frontend display"""
    try:
        processed_path = OUTPUT_DIR / f"{video_id}_output.mp4"
        
        if not processed_path.exists():
            raise HTTPException(status_code=404, detail="Processed video not found")
        
        # Read video file and encode as base64
        with open(processed_path, "rb") as video_file:
            video_data = video_file.read()
            
        import base64
        video_base64 = base64.b64encode(video_data).decode('utf-8')
        
        return {
            "success": True,
            "video_id": video_id,
            "video_data": video_base64,
            "video_size": len(video_data),
            "mime_type": "video/mp4"
        }
        
    except Exception as e:
        logger.error(f"Error getting processed video data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get processed video: {str(e)}")

# Logging endpoints
@app.get("/api/logs")
async def get_logs(limit: Optional[int] = None, log_type: Optional[str] = None):
    """Get application logs"""
    try:
        logs = action_logger.get_logs(limit=limit, log_type=log_type)
        return {
            "success": True,
            "logs": logs,
            "count": len(logs),
            "session_id": action_logger.session_id
        }
    except Exception as e:
        logger.error(f"Error getting logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")

@app.get("/api/logs/stats")
async def get_log_stats():
    """Get logging statistics"""
    try:
        stats = action_logger.get_log_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting log stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get log stats: {str(e)}")

@app.get("/api/logs/video/{video_id}")
async def get_video_logs(video_id: str):
    """Get logs for a specific video"""
    try:
        logs = action_logger.get_logs_for_video(video_id)
        return {
            "success": True,
            "video_id": video_id,
            "logs": logs,
            "count": len(logs)
        }
    except Exception as e:
        logger.error(f"Error getting video logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get video logs: {str(e)}")

@app.get("/api/logs/recent")
async def get_recent_logs(minutes: int = 5):
    """Get recent logs from the last N minutes"""
    try:
        logs = action_logger.get_recent_logs(minutes=minutes)
        return {
            "success": True,
            "logs": logs,
            "count": len(logs),
            "minutes": minutes
        }
    except Exception as e:
        logger.error(f"Error getting recent logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent logs: {str(e)}")

@app.post("/api/logs/clear")
async def clear_logs():
    """Clear all logs"""
    try:
        action_logger.clear_logs()
        action_logger.log_system_event("LOGS_CLEARED", "All logs cleared by user")
        return {
            "success": True,
            "message": "All logs cleared successfully"
        }
    except Exception as e:
        logger.error(f"Error clearing logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear logs: {str(e)}")

@app.get("/api/logs/export")
async def export_logs():
    """Export logs to JSON file"""
    try:
        file_path = action_logger.export_logs()
        action_logger.log_system_event("LOGS_EXPORTED", f"Logs exported to {file_path}")
        return FileResponse(
            path=file_path,
            media_type="application/json",
            filename="logs_export.json"
        )
    except Exception as e:
        logger.error(f"Error exporting logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export logs: {str(e)}")

@app.get("/api/test-supabase-upload")
async def test_supabase_upload():
    """Test Supabase upload functionality"""
    try:
        import requests
        import os
        
        # Check environment variables
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        logger.info(f"Testing Supabase upload - URL: {'SET' if supabase_url else 'MISSING'}, Key: {'SET' if supabase_key else 'MISSING'}")
        
        if not supabase_url or not supabase_key:
            return {
                "success": False,
                "error": "Missing Supabase environment variables",
                "supabase_url": "SET" if supabase_url else "MISSING",
                "supabase_key": "SET" if supabase_key else "MISSING"
            }
        
        # Create a small test file
        test_data = b"test video data"
        test_path = "test/test_upload.mp4"
        
        # Try uploading to Supabase
        upload_url = f"{supabase_url}/storage/v1/object/patient_videos/{test_path}"
        logger.info(f"Testing upload to: {upload_url}")
        
        upload_response = requests.post(
            upload_url,
            headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}',
                'Content-Type': 'video/mp4'
            },
            data=test_data
        )
        
        logger.info(f"Test upload response: {upload_response.status_code} - {upload_response.text}")
        
        return {
            "success": upload_response.status_code == 200,
            "status_code": upload_response.status_code,
            "response_text": upload_response.text,
            "upload_url": upload_url,
            "test_data_size": len(test_data)
        }
        
    except Exception as e:
        logger.error(f"Error testing Supabase upload: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
