#!/usr/bin/env python3
"""
Log Viewer Utility for AI Trading Platform
View, filter, and analyze log files
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import re
from collections import defaultdict, Counter

def colorize(text, color):
    """Add color to text for terminal output"""
    colors = {
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'magenta': '\033[95m',
        'cyan': '\033[96m',
        'white': '\033[97m',
        'bold': '\033[1m',
        'end': '\033[0m'
    }
    return f"{colors.get(color, '')}{text}{colors['end']}"

def get_log_files(log_dir="logs"):
    """Get all log files in the directory"""
    log_path = Path(log_dir)
    if not log_path.exists():
        return []
    
    return list(log_path.glob("*.log"))

def parse_log_line(line):
    """Parse a log line and extract components"""
    # Pattern for our log format: timestamp - name - level - filename:line - message
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - ([^-]+) - (\w+) - ([^-]+) - (.+)'
    match = re.match(pattern, line.strip())
    
    if match:
        return {
            'timestamp': match.group(1),
            'logger': match.group(2).strip(),
            'level': match.group(3),
            'location': match.group(4).strip(),
            'message': match.group(5).strip(),
            'raw': line.strip()
        }
    else:
        # Fallback for simpler format
        simple_pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - (\w+) - (.+)'
        simple_match = re.match(simple_pattern, line.strip())
        if simple_match:
            return {
                'timestamp': simple_match.group(1),
                'logger': 'unknown',
                'level': simple_match.group(2),
                'location': 'unknown',
                'message': simple_match.group(3).strip(),
                'raw': line.strip()
            }
    
    return {
        'timestamp': 'unknown',
        'logger': 'unknown',
        'level': 'INFO',
        'location': 'unknown',
        'message': line.strip(),
        'raw': line.strip()
    }

def filter_logs(lines, level=None, logger=None, search=None, since=None):
    """Filter log lines based on criteria"""
    filtered = []
    
    for line in lines:
        parsed = parse_log_line(line)
        
        # Level filter
        if level and parsed['level'] != level.upper():
            continue
            
        # Logger filter
        if logger and logger.lower() not in parsed['logger'].lower():
            continue
            
        # Search filter
        if search and search.lower() not in parsed['message'].lower():
            continue
            
        # Time filter
        if since:
            try:
                log_time = datetime.strptime(parsed['timestamp'], '%Y-%m-%d %H:%M:%S,%f')
                if log_time < since:
                    continue
            except:
                pass  # Skip time filtering if parsing fails
                
        filtered.append(parsed)
    
    return filtered

def display_logs(logs, colorized=True, max_lines=None):
    """Display logs with optional colorization"""
    if max_lines:
        logs = logs[-max_lines:]
    
    for log in logs:
        if colorized:
            # Colorize based on log level
            level_colors = {
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'magenta'
            }
            
            level_color = level_colors.get(log['level'], 'white')
            timestamp = colorize(log['timestamp'], 'blue')
            level = colorize(f"[{log['level']}]", level_color)
            logger = colorize(log['logger'], 'cyan')
            location = colorize(log['location'], 'yellow')
            
            print(f"{timestamp} {level} {logger} {location}")
            print(f"  {log['message']}")
            print()
        else:
            print(log['raw'])

def analyze_logs(logs):
    """Analyze logs and provide statistics"""
    if not logs:
        print("No logs to analyze")
        return
    
    # Count by level
    level_counts = Counter(log['level'] for log in logs)
    
    # Count by logger
    logger_counts = Counter(log['logger'] for log in logs)
    
    # Count by hour
    hour_counts = defaultdict(int)
    for log in logs:
        try:
            log_time = datetime.strptime(log['timestamp'], '%Y-%m-%d %H:%M:%S,%f')
            hour_key = log_time.strftime('%Y-%m-%d %H:00')
            hour_counts[hour_key] += 1
        except:
            pass
    
    # Find common error patterns
    error_patterns = defaultdict(int)
    for log in logs:
        if log['level'] in ['ERROR', 'CRITICAL']:
            # Extract potential error patterns
            message = log['message'].lower()
            if 'connection' in message:
                error_patterns['Connection Issues'] += 1
            elif 'timeout' in message:
                error_patterns['Timeout Issues'] += 1
            elif 'failed' in message:
                error_patterns['Failed Operations'] += 1
            elif 'error' in message:
                error_patterns['General Errors'] += 1
    
    print(colorize("📊 LOG ANALYSIS REPORT", 'bold'))
    print("=" * 50)
    
    print(f"\n📈 Total Log Entries: {len(logs)}")
    
    print(f"\n🎯 Log Levels:")
    for level, count in level_counts.most_common():
        color = {'ERROR': 'red', 'WARNING': 'yellow', 'INFO': 'green', 'DEBUG': 'cyan'}.get(level, 'white')
        print(f"  {colorize(level, color)}: {count}")
    
    print(f"\n🔧 Loggers:")
    for logger, count in logger_counts.most_common(10):
        print(f"  {colorize(logger, 'cyan')}: {count}")
    
    if error_patterns:
        print(f"\n❌ Error Patterns:")
        for pattern, count in error_patterns.most_common():
            print(f"  {colorize(pattern, 'red')}: {count}")
    
    if hour_counts:
        print(f"\n⏰ Activity by Hour (last 24 hours):")
        sorted_hours = sorted(hour_counts.items())[-24:]
        for hour, count in sorted_hours:
            print(f"  {hour}: {count} entries")

def tail_logs(log_file, lines=50, follow=False):
    """Tail log file (like tail -f)"""
    try:
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            # Get last N lines
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:]
            
            for line in recent_lines:
                parsed = parse_log_line(line)
                display_logs([parsed], colorized=True)
            
            if follow:
                print(colorize("Following log file... (Ctrl+C to stop)", 'yellow'))
                # Simple follow implementation
                f.seek(0, 2)  # Go to end of file
                while True:
                    line = f.readline()
                    if line:
                        parsed = parse_log_line(line)
                        display_logs([parsed], colorized=True)
                    else:
                        import time
                        time.sleep(0.1)
                        
    except KeyboardInterrupt:
        print(colorize("\nStopped following log file", 'yellow'))
    except FileNotFoundError:
        print(colorize(f"Log file {log_file} not found", 'red'))
    except Exception as e:
        print(colorize(f"Error reading log file: {e}", 'red'))

def main():
    parser = argparse.ArgumentParser(description='AI Trading Platform Log Viewer')
    parser.add_argument('--log-dir', default='logs', help='Log directory (default: logs)')
    parser.add_argument('--file', help='Specific log file to view')
    parser.add_argument('--level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'], 
                       help='Filter by log level')
    parser.add_argument('--logger', help='Filter by logger name')
    parser.add_argument('--search', help='Search for text in log messages')
    parser.add_argument('--since', help='Show logs since time (e.g., "2024-01-01 12:00:00")')
    parser.add_argument('--tail', type=int, default=50, help='Show last N lines (default: 50)')
    parser.add_argument('--follow', '-f', action='store_true', help='Follow log file (like tail -f)')
    parser.add_argument('--analyze', action='store_true', help='Analyze logs and show statistics')
    parser.add_argument('--list', action='store_true', help='List available log files')
    parser.add_argument('--no-color', action='store_true', help='Disable colored output')
    
    args = parser.parse_args()
    
    # List available log files
    if args.list:
        log_files = get_log_files(args.log_dir)
        if log_files:
            print(colorize("📁 Available Log Files:", 'bold'))
            for log_file in log_files:
                stat = log_file.stat()
                size_mb = stat.st_size / (1024 * 1024)
                modified = datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                print(f"  {colorize(log_file.name, 'cyan')}: {size_mb:.2f} MB, modified {modified}")
        else:
            print(colorize("No log files found", 'yellow'))
        return
    
    # Parse since time
    since_time = None
    if args.since:
        try:
            since_time = datetime.strptime(args.since, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            print(colorize("Invalid since time format. Use: YYYY-MM-DD HH:MM:SS", 'red'))
            return
    
    # Determine which log file to use
    if args.file:
        log_file = Path(args.file)
        if not log_file.exists():
            log_file = Path(args.log_dir) / args.file
    else:
        # Default to app.log
        log_file = Path(args.log_dir) / "app.log"
    
    if not log_file.exists():
        print(colorize(f"Log file {log_file} not found", 'red'))
        print(colorize("Available files:", 'yellow'))
        for f in get_log_files(args.log_dir):
            print(f"  {f.name}")
        return
    
    # Follow mode
    if args.follow:
        tail_logs(log_file, args.tail, follow=True)
        return
    
    # Read log file
    try:
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        print(colorize(f"Error reading log file: {e}", 'red'))
        return
    
    # Parse and filter logs
    parsed_logs = [parse_log_line(line) for line in lines]
    filtered_logs = filter_logs(parsed_logs, args.level, args.logger, args.search, since_time)
    
    # Show analysis or logs
    if args.analyze:
        analyze_logs(filtered_logs)
    else:
        print(colorize(f"📋 Showing logs from: {log_file.name}", 'bold'))
        if args.level or args.logger or args.search or args.since:
            print(colorize(f"🔍 Filters applied - showing {len(filtered_logs)} of {len(parsed_logs)} entries", 'yellow'))
        print("-" * 80)
        display_logs(filtered_logs, colorized=not args.no_color, max_lines=args.tail)

if __name__ == "__main__":
    main()