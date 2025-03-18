import cv2
import numpy as np
import pytesseract
from pathlib import Path
import json
import argparse
from typing import List, Tuple, Dict

def detect_dark_frames(video_path: str, threshold: int = 20, min_duration: float = 0.1) -> List[float]:
    """Detect dark frame transitions and return their end times."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    min_frames = int(min_duration * fps)
    
    transitions = []
    dark_start = None
    dark_frame_count = 0
    frame_number = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        is_dark = np.max(gray) < threshold
        
        if is_dark:
            if dark_start is None:
                dark_start = frame_number
            dark_frame_count += 1
        else:
            if dark_start is not None and dark_frame_count >= min_frames:
                # Store the end of dark sequence
                transitions.append(frame_number)
                dark_start = None
                dark_frame_count = 0
        
        frame_number += 1
    
    cap.release()
    return [t / fps for t in transitions]

def capture_title_frame(video_path: str, timestamp: float) -> np.ndarray:
    """Capture the frame 1 second after the given timestamp."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    # Wait 1 second after transition
    frame_number = int(timestamp * fps) + int(fps)
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise ValueError(f"Could not read frame at {timestamp}")
    
    return frame

def extract_title_area(frame: np.ndarray) -> Tuple[np.ndarray, np.ndarray, tuple]:
    """Extract the top portion of the frame where titles typically appear.
    Returns: (title_area, marked_frame, (x1,y1,x2,y2))"""
    height, width = frame.shape[:2]
    
    # Define title area (top 20% of frame, focusing on the center 80% width)
    y1 = 0
    y2 = int(height * 0.2)  # Increased from 0.15 to 0.2
    x1 = int(width * 0.1)   # Start at 10% from left
    x2 = int(width * 0.9)   # End at 90% from left
    
    # Extract title area
    title_area = frame[y1:y2, x1:x2]
    
    # Create a copy of frame with title area marked
    marked_frame = frame.copy()
    cv2.rectangle(marked_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    return title_area, marked_frame, (x1, y1, x2, y2)

def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
    """Preprocess image for better OCR results."""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Threshold to get initial binary image (white text on black)
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    
    # Find edges from inside the text using morphological gradient
    kernel = np.ones((3,3), np.uint8)
    gradient = cv2.morphologyEx(binary, cv2.MORPH_GRADIENT, kernel)
    
    # Dilate slightly to connect any broken edges
    dilated = cv2.dilate(gradient, kernel, iterations=1)
    
    # Invert for OCR (black text on white background)
    result = cv2.bitwise_not(dilated)
    
    return result

def save_debug_images(debug_dir: Path, index: int, frame: np.ndarray, title_area: np.ndarray, 
                     processed: np.ndarray, marked_frame: np.ndarray, timestamp: float, text: str, video_path: str):
    """Save debug images and information for analysis."""
    # Create numbered subdirectory for this transition
    frame_dir = debug_dir / f"frame_{index:03d}"
    frame_dir.mkdir(exist_ok=True)
    
    # Save original full frame
    cv2.imwrite(str(frame_dir / "01_full_frame.png"), frame)
    
    # Save frame with title area marked
    cv2.imwrite(str(frame_dir / "02_marked_frame.png"), marked_frame)
    
    # Save extracted title area
    cv2.imwrite(str(frame_dir / "03_title_area.png"), title_area)
    
    # Save processed title area
    cv2.imwrite(str(frame_dir / "04_processed.png"), processed)
    
    # Calculate frame number outside of metadata creation
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    frame_number = int(timestamp * fps)
    
    # Save metadata
    metadata = {
        "timestamp": timestamp,
        "detected_text": text,
        "frame_number": frame_number
    }
    
    with open(frame_dir / "metadata.json", 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

def detect_titles(video_path: str) -> Dict[float, str]:
    """Detect chapter titles in the video using dark frame detection and OCR."""
    print(f"\nProcessing video: {video_path}")
    print("="*80)
    
    # Configure Tesseract for Hebrew
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    # Custom Tesseract configuration - with exact colors
    custom_config = (
        '--oem 3 --psm 7 -l heb+script/Hebrew --dpi 300 '
        '-c tessedit_write_images=1 '
        '-c textord_dark_mode_bold=1 '
        '-c textord_min_linesize=3.0 '
        '-c tessedit_fg_color=255,255,255 '  # White text
        '-c tessedit_bg_color=0,0,205 '      # Royal blue background
        '-c tessedit_preserve_fg_color=1'     # Preserve exact colors
    )
    
    # Detect transitions
    transitions = detect_dark_frames(video_path)
    print(f"\nFound {len(transitions)} transitions")
    print("-"*80)
    
    # Create output directory for debug images
    debug_dir = Path("debug_frames") / Path(video_path).stem
    debug_dir.mkdir(exist_ok=True, parents=True)
    
    titles = {}
    for i, timestamp in enumerate(transitions):
        try:
            print(f"\nProcessing transition {i+1}...")
            
            # Capture frame after transition
            frame = capture_title_frame(video_path, timestamp)
            print("Frame captured")
            
            # Extract title area and get marked frame
            title_area, marked_frame, bbox = extract_title_area(frame)
            print("Title area extracted")
            
            # Preprocess for OCR
            processed = preprocess_for_ocr(title_area)
            print("Image preprocessed")
            
            # Try OCR with preprocessed image
            print("Attempting OCR...")
            text = pytesseract.image_to_string(processed, config=custom_config)
            text = text.strip()
            print(f"OCR result: '{text}'")
            
            # Save all debug information
            save_debug_images(debug_dir, i, frame, title_area, processed, 
                            marked_frame, timestamp, text, video_path)
            print("Debug images saved")
            
            if text:
                titles[timestamp] = text
                print(f"\nTransition {i+1} at {timestamp:.2f}s:")
                print("Detected Text:")
                print("-"*40)
                print(text)
                print("-"*40)
            else:
                print(f"\nTransition {i+1} at {timestamp:.2f}s: No text detected")
            
        except Exception as e:
            print(f"Error processing transition at {timestamp:.2f}s: {e}")
            import traceback
            print(traceback.format_exc())
    
    print("\nFinal titles dictionary:", titles)
    return titles

def main():
    parser = argparse.ArgumentParser(description="Detect chapter titles in video")
    parser.add_argument("video_path", help="Path to the video file")
    parser.add_argument("--output", help="Output JSON file path")
    args = parser.parse_args()
    
    try:
        titles = detect_titles(args.video_path)
        
        if args.output:
            output_path = args.output
        else:
            video_path = Path(args.video_path)
            output_path = video_path.with_suffix('.titles.json')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(titles, f, ensure_ascii=False, indent=2)
        
        print(f"\nResults saved to {output_path}")
        print(f"Debug frames saved to debug_frames/")
        
    except Exception as e:
        print(f"Error processing video: {e}")

if __name__ == "__main__":
    main() 