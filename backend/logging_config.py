"""
Comprehensive logging configuration for AI Trading Platform
Enables file logging, console logging, and log rotation
"""

import logging
import logging.handlers
import os
from datetime import datetime
from pathlib import Path

def setup_logging(log_level=logging.INFO, log_dir="logs"):
    """
    Set up comprehensive logging for the AI Trading Platform
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory to store log files
    """
    
    # Create logs directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(simple_formatter)
    root_logger.addHandler(console_handler)
    
    # Main application log file (rotating)
    app_log_file = log_path / "app.log"
    app_handler = logging.handlers.RotatingFileHandler(
        app_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    app_handler.setLevel(log_level)
    app_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(app_handler)
    
    # Error log file (only errors and critical)
    error_log_file = log_path / "error.log"
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(error_handler)
    
    # WebSocket specific log file
    websocket_log_file = log_path / "websocket.log"
    websocket_handler = logging.handlers.RotatingFileHandler(
        websocket_log_file,
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    websocket_handler.setLevel(log_level)
    websocket_handler.setFormatter(detailed_formatter)
    
    # Add websocket handler to websocket logger
    websocket_logger = logging.getLogger('websocket_server')
    websocket_logger.addHandler(websocket_handler)
    
    # Trading signals log file
    signals_log_file = log_path / "trading_signals.log"
    signals_handler = logging.handlers.RotatingFileHandler(
        signals_log_file,
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    signals_handler.setLevel(log_level)
    signals_handler.setFormatter(detailed_formatter)
    
    # Add signals handler to signals logger
    signals_logger = logging.getLogger('realtime_signal_service')
    signals_logger.addHandler(signals_handler)
    
    # MT5 service log file
    mt5_log_file = log_path / "mt5_service.log"
    mt5_handler = logging.handlers.RotatingFileHandler(
        mt5_log_file,
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    mt5_handler.setLevel(log_level)
    mt5_handler.setFormatter(detailed_formatter)
    
    # Add MT5 handler to MT5 logger
    mt5_logger = logging.getLogger('mt5_service')
    mt5_logger.addHandler(mt5_handler)
    
    # Daily log file (for archival purposes)
    today = datetime.now().strftime("%Y-%m-%d")
    daily_log_file = log_path / f"daily_{today}.log"
    daily_handler = logging.FileHandler(daily_log_file)
    daily_handler.setLevel(log_level)
    daily_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(daily_handler)
    
    # Log the setup completion
    logger = logging.getLogger(__name__)
    logger.info("🔧 Logging system initialized")
    logger.info(f"📁 Log directory: {log_path.absolute()}")
    logger.info(f"📊 Log level: {logging.getLevelName(log_level)}")
    logger.info("📝 Log files created:")
    logger.info(f"   - app.log (main application logs)")
    logger.info(f"   - error.log (errors and critical issues)")
    logger.info(f"   - websocket.log (WebSocket server logs)")
    logger.info(f"   - trading_signals.log (trading signal logs)")
    logger.info(f"   - mt5_service.log (MetaTrader 5 service logs)")
    logger.info(f"   - daily_{today}.log (daily archive)")
    
    return root_logger

def get_log_stats(log_dir="logs"):
    """
    Get statistics about log files
    
    Args:
        log_dir: Directory containing log files
        
    Returns:
        dict: Log file statistics
    """
    log_path = Path(log_dir)
    
    if not log_path.exists():
        return {"error": "Log directory does not exist"}
    
    stats = {}
    
    for log_file in log_path.glob("*.log"):
        try:
            file_stats = log_file.stat()
            stats[log_file.name] = {
                "size_bytes": file_stats.st_size,
                "size_mb": round(file_stats.st_size / (1024 * 1024), 2),
                "modified": datetime.fromtimestamp(file_stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "lines": sum(1 for _ in open(log_file, 'r', encoding='utf-8', errors='ignore'))
            }
        except Exception as e:
            stats[log_file.name] = {"error": str(e)}
    
    return stats

def tail_log(log_file="logs/app.log", lines=50):
    """
    Get the last N lines from a log file
    
    Args:
        log_file: Path to log file
        lines: Number of lines to return
        
    Returns:
        list: Last N lines from the log file
    """
    try:
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            return f.readlines()[-lines:]
    except FileNotFoundError:
        return [f"Log file {log_file} not found"]
    except Exception as e:
        return [f"Error reading log file: {e}"]

if __name__ == "__main__":
    # Test the logging setup
    setup_logging(log_level=logging.DEBUG)
    
    # Test different log levels
    logger = logging.getLogger("test_logger")
    logger.debug("🐛 This is a debug message")
    logger.info("ℹ️ This is an info message")
    logger.warning("⚠️ This is a warning message")
    logger.error("❌ This is an error message")
    logger.critical("🚨 This is a critical message")
    
    # Show log stats
    print("\n📊 Log Statistics:")
    stats = get_log_stats()
    for filename, file_stats in stats.items():
        if "error" not in file_stats:
            print(f"   {filename}: {file_stats['size_mb']} MB, {file_stats['lines']} lines")
        else:
            print(f"   {filename}: {file_stats['error']}")