from fastapi import FastAPI, File, UploadFile, HTTPException, Request
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
# from two_stage_claude_analyzer import TwoStageClaudeAnalyzer
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
# two_stage_claude_analyzer = TwoStageClaudeAnalyzer()
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
async def stream_processed_video(video_id: str, request: Request):
    """Stream processed video with pose landmarks"""
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
            "Content-Length": str(processed_path.stat().st_size)
        }
    )

@app.get("/api/video/{video_id}")
@app.head("/api/video/{video_id}")
async def get_original_video(video_id: str, request: Request):
    """Get original video file"""
    video_path = UPLOAD_DIR / f"{video_id}.mp4"
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"{video_id}.mp4"
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
        
        # Extract key frames
        action_logger.log_processing_step("KEY_FRAME_EXTRACTION", video_id, "started")
        analysis_package = key_frame_extractor.extract_key_frames(
            str(video_path), 
            str(key_frames_dir),
            str(angle_file)
        )
        action_logger.log_processing_step("KEY_FRAME_EXTRACTION", video_id, "completed")
        
        if analysis_package.get('error'):
            action_logger.log_error("KEY_FRAME_EXTRACTION_FAILED", analysis_package['error'], {"video_id": video_id})
            raise HTTPException(status_code=500, detail=f"Key frame extraction failed: {analysis_package['error']}")
        
        # Perform two-stage analysis
        analysis_result = two_stage_claude_analyzer.perform_two_stage_analysis(
            str(video_path),
            analysis_package,
            str(OUTPUT_DIR)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
