import cv2
import numpy as np
from typing import List, Tuple
import argparse
from pathlib import Path

def detect_dark_transitions(video_path: str, threshold: int = 20, min_duration: float = 0.1) -> List[Tuple[float, float]]:
    """
    Detect dark frame transitions in a video.
    
    Args:
        video_path: Path to the video file
        threshold: Maximum pixel value to consider as "dark" (0-255)
        min_duration: Minimum duration in seconds for a dark sequence to be considered a transition
        
    Returns:
        List of (start_time, end_time) tuples in seconds where dark transitions occur
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    min_frames = int(min_duration * fps)
    
    transitions = []
    dark_start = None
    dark_frame_count = 0
    frame_number = 0
    
    print(f"Processing video at {fps} FPS...")
    print(f"Looking for dark frames (max pixel value < {threshold})")
    print(f"Minimum transition duration: {min_duration} seconds ({min_frames} frames)")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Check if frame is dark
        is_dark = np.max(gray) < threshold
        
        # State machine for detecting dark sequences
        if is_dark:
            if dark_start is None:
                dark_start = frame_number
            dark_frame_count += 1
        else:
            if dark_start is not None:
                # If we had enough dark frames, record the transition
                if dark_frame_count >= min_frames:
                    start_time = dark_start / fps
                    end_time = frame_number / fps
                    transitions.append((start_time, end_time))
                    print(f"Found transition: {start_time:.2f}s - {end_time:.2f}s ({dark_frame_count} frames)")
                
                dark_start = None
                dark_frame_count = 0
        
        frame_number += 1
        
        # Progress indicator every 1000 frames
        if frame_number % 1000 == 0:
            duration = frame_number / fps
            print(f"Processed {duration:.1f} seconds...")
    
    # Handle case where video ends during a dark sequence
    if dark_start is not None and dark_frame_count >= min_frames:
        start_time = dark_start / fps
        end_time = frame_number / fps
        transitions.append((start_time, end_time))
        print(f"Found transition: {start_time:.2f}s - {end_time:.2f}s ({dark_frame_count} frames)")
    
    cap.release()
    
    print(f"\nFound {len(transitions)} transitions")
    return transitions

def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS.mmm format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:06.3f}"

def format_youtube_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS format for YouTube chapters"""
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes}:{seconds:02d}"

def main():
    parser = argparse.ArgumentParser(description="Detect dark frame transitions in video")
    parser.add_argument("video_path", help="Path to the video file")
    parser.add_argument("--threshold", type=int, default=20, 
                      help="Maximum pixel value to consider as dark (0-255)")
    parser.add_argument("--min-duration", type=float, default=0.1,
                      help="Minimum duration in seconds for a transition")
    args = parser.parse_args()
    
    video_path = args.video_path
    if not Path(video_path).exists():
        print(f"Error: Video file not found: {video_path}")
        return
    
    try:
        transitions = detect_dark_transitions(
            video_path, 
            threshold=args.threshold,
            min_duration=args.min_duration
        )
        
        print("\nDetailed transitions:")
        print("Start Time      End Time        Duration")
        print("-" * 45)
        
        for start, end in transitions:
            duration = end - start
            print(f"{format_timestamp(start)}  {format_timestamp(end)}  {duration:.3f}s")
        
        # Add YouTube chapters format output
        print("\nYouTube Chapters Format:")
        print("------------------------")
        print("0:00 Introduction")  # Always start with 0:00
        
        # Use the end times of transitions as chapter start times
        for i, (_, end) in enumerate(transitions, 1):
            print(f"{format_youtube_timestamp(end)} Chapter {i}")
            
    except Exception as e:
        print(f"Error processing video: {e}")

if __name__ == "__main__":
    main() 