import json
import time
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import threading
from collections import deque
import uuid

class ActionLogger:
    """
    Comprehensive logging system for all application actions
    Logs API calls, Claude prompts, processing steps, and system events
    """
    
    def __init__(self, max_logs: int = 1000):
        self.max_logs = max_logs
        self.logs = deque(maxlen=max_logs)
        self.lock = threading.Lock()
        self.session_id = str(uuid.uuid4())
        
        # Create logs directory
        self.logs_dir = Path("logs")
        self.logs_dir.mkdir(exist_ok=True)
        
        # Log system startup
        self.log_system_event("SYSTEM_STARTUP", "Action logger initialized", {"session_id": self.session_id})
    
    def log_api_call(self, method: str, endpoint: str, status_code: int, duration_ms: float, 
                    request_data: Optional[Dict] = None, response_data: Optional[Dict] = None):
        """Log API call details"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "API_CALL",
            "level": "INFO",
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "request_data": self._sanitize_data(request_data),
            "response_data": self._sanitize_data(response_data),
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_claude_call(self, prompt_type: str, prompt_length: int, response_length: int, 
                       duration_ms: float, model: str, success: bool, error: Optional[str] = None):
        """Log Claude API call details"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "CLAUDE_CALL",
            "level": "INFO" if success else "ERROR",
            "prompt_type": prompt_type,
            "prompt_length": prompt_length,
            "response_length": response_length,
            "duration_ms": duration_ms,
            "model": model,
            "success": success,
            "error": error,
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_processing_step(self, step_name: str, video_id: str, status: str, 
                          details: Optional[Dict] = None, duration_ms: Optional[float] = None):
        """Log video processing steps"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "PROCESSING_STEP",
            "level": "INFO",
            "step_name": step_name,
            "video_id": video_id,
            "status": status,
            "details": details or {},
            "duration_ms": duration_ms,
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_system_event(self, event_type: str, message: str, data: Optional[Dict] = None):
        """Log system events"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "SYSTEM_EVENT",
            "level": "INFO",
            "event_type": event_type,
            "message": message,
            "data": data or {},
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_error(self, error_type: str, message: str, error_data: Optional[Dict] = None):
        """Log errors"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "ERROR",
            "level": "ERROR",
            "error_type": error_type,
            "message": message,
            "error_data": error_data or {},
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_prompt_sent(self, prompt_type: str, prompt_content: str, model: str):
        """Log detailed prompt information"""
        # Truncate very long prompts for logging
        truncated_prompt = prompt_content[:1000] + "..." if len(prompt_content) > 1000 else prompt_content
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "PROMPT_SENT",
            "level": "DEBUG",
            "prompt_type": prompt_type,
            "prompt_content": truncated_prompt,
            "prompt_length": len(prompt_content),
            "model": model,
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_response_received(self, response_type: str, response_content: str, model: str):
        """Log detailed response information"""
        # Truncate very long responses for logging
        truncated_response = response_content[:1000] + "..." if len(response_content) > 1000 else response_content
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "RESPONSE_RECEIVED",
            "level": "DEBUG",
            "response_type": response_type,
            "response_content": truncated_response,
            "response_length": len(response_content),
            "model": model,
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def log_file_operation(self, operation: str, file_path: str, success: bool, 
                          file_size: Optional[int] = None, error: Optional[str] = None):
        """Log file operations"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "FILE_OPERATION",
            "level": "INFO" if success else "ERROR",
            "operation": operation,
            "file_path": str(file_path),
            "success": success,
            "file_size": file_size,
            "error": error,
            "session_id": self.session_id
        }
        self._add_log(log_entry)
    
    def _add_log(self, log_entry: Dict):
        """Add log entry to the queue"""
        with self.lock:
            self.logs.append(log_entry)
    
    def _sanitize_data(self, data: Optional[Dict]) -> Optional[Dict]:
        """Sanitize sensitive data from logs"""
        if not data:
            return None
        
        # Create a copy to avoid modifying original data
        sanitized = data.copy()
        
        # Remove or mask sensitive fields
        sensitive_fields = ['api_key', 'password', 'token', 'secret', 'key']
        for field in sensitive_fields:
            if field in sanitized:
                sanitized[field] = "***REDACTED***"
        
        # Truncate very large data
        for key, value in sanitized.items():
            if isinstance(value, str) and len(value) > 500:
                sanitized[key] = value[:500] + "..."
        
        return sanitized
    
    def get_logs(self, limit: Optional[int] = None, log_type: Optional[str] = None) -> List[Dict]:
        """Get logs with optional filtering"""
        with self.lock:
            logs = list(self.logs)
        
        # Filter by type if specified
        if log_type:
            logs = [log for log in logs if log.get('type') == log_type]
        
        # Limit results
        if limit:
            logs = logs[-limit:]
        
        return logs
    
    def get_logs_for_video(self, video_id: str) -> List[Dict]:
        """Get logs for a specific video"""
        with self.lock:
            logs = [log for log in self.logs if log.get('video_id') == video_id]
        
        return logs
    
    def get_recent_logs(self, minutes: int = 5) -> List[Dict]:
        """Get logs from the last N minutes"""
        cutoff_time = datetime.now().timestamp() - (minutes * 60)
        
        with self.lock:
            logs = []
            for log in self.logs:
                log_time = datetime.fromisoformat(log['timestamp']).timestamp()
                if log_time >= cutoff_time:
                    logs.append(log)
        
        return logs
    
    def clear_logs(self):
        """Clear all logs"""
        with self.lock:
            self.logs.clear()
    
    def export_logs(self, file_path: Optional[str] = None) -> str:
        """Export logs to JSON file"""
        if not file_path:
            file_path = self.logs_dir / f"logs_{self.session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with self.lock:
            logs_data = {
                "session_id": self.session_id,
                "export_timestamp": datetime.now().isoformat(),
                "total_logs": len(self.logs),
                "logs": list(self.logs)
            }
        
        with open(file_path, 'w') as f:
            json.dump(logs_data, f, indent=2)
        
        return str(file_path)
    
    def get_log_stats(self) -> Dict:
        """Get logging statistics"""
        with self.lock:
            total_logs = len(self.logs)
            log_types = {}
            log_levels = {}
            
            for log in self.logs:
                log_type = log.get('type', 'unknown')
                log_level = log.get('level', 'unknown')
                
                log_types[log_type] = log_types.get(log_type, 0) + 1
                log_levels[log_level] = log_levels.get(log_level, 0) + 1
        
        return {
            "total_logs": total_logs,
            "log_types": log_types,
            "log_levels": log_levels,
            "session_id": self.session_id,
            "max_logs": self.max_logs
        }

# Global logger instance
action_logger = ActionLogger()

# Example usage
if __name__ == "__main__":
    logger = ActionLogger()
    logger.log_system_event("TEST", "Testing logger", {"test": True})
    print("Action logger initialized successfully!")
