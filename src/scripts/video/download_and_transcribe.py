#!/usr/bin/env python3
"""
Vimeo Video Downloader and Transcriber

This script:
1. Downloads videos from Vimeo using the API
2. Transcribes them using Whisper
3. Stores transcriptions in a structured format

Requirements:
    pip install PyVimeo openai-whisper tqdm python-dotenv
    # On Windows, install FFmpeg:
    winget install ffmpeg
    # Or download from https://www.gyan.dev/ffmpeg/builds/ and add to PATH
"""

import os
import sys
import time
import json
import vimeo
import whisper
import subprocess
from tqdm import tqdm
from typing import List, Dict
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def check_ffmpeg():
    """Check if FFmpeg is installed and accessible."""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True)
        return True
    except FileNotFoundError:
        print("❌ FFmpeg not found! Please install FFmpeg:")
        print("1. Run: winget install ffmpeg")
        print("   OR")
        print("2. Download from https://www.gyan.dev/ffmpeg/builds/")
        print("   and add to PATH")
        return False

class VideoProcessor:
    def __init__(self, access_token: str):
        """Initialize the Vimeo client and Whisper model."""
        if not check_ffmpeg():
            sys.exit(1)
            
        self.client = vimeo.VimeoClient(token=access_token)
        self.folders_cache = {}
        
        # Use absolute paths based on the script's location
        script_dir = Path(__file__).parent.absolute()
        workspace_dir = script_dir.parent.parent.parent  # Go up to workspace root
        
        self.download_dir = workspace_dir / "downloaded_videos"
        self.transcripts_dir = workspace_dir / "transcripts"
        self.progress_file = workspace_dir / "processing_progress.json"
        
        print(f"\n📂 Workspace directory: {workspace_dir}")
        print(f"📂 Downloads directory: {self.download_dir}")
        print(f"📂 Transcripts directory: {self.transcripts_dir}")
        
        # Create necessary directories
        self.download_dir.mkdir(exist_ok=True)
        self.transcripts_dir.mkdir(exist_ok=True)
        
        # Load or create progress tracking
        self.progress = self.load_progress()
        
        # Common Hebrew corrections for safety terms
        self.hebrew_corrections = {
            # Common word mistakes
            'בתיכות': 'בטיחות',
            'למיפל': 'למפעל',
            'הקשירות': 'הכשירות',
            'כשירות': 'כשירות',
            'מיפעל': 'מפעל',
            'בתיחות': 'בטיחות',
            'העבונה': 'העבודה',
            'מובדים': 'עובדים',
            'בטחות': 'בטיחות',
            'גיעות': 'גהות',
            'תקנת': 'תקנות',
            'תעונות': 'תאונות',
            'סיכונם': 'סיכונים',
            'הדרחת': 'הדרכת',
            'עובדם': 'עובדים',
            'מפגעם': 'מפגעים',
            'בתיחותי': 'בטיחותי',
            'תפקדו': 'תפקידו',
            'סמכיות': 'סמכויות',
            
            # New corrections from transcript analysis
            'בועדת': 'בוועדת',
            'לביתיכות': 'לבטיחות',
            'בעדת': 'בוועדת',
            
            # Common phrases
            'ועדת בתיכות': 'ועדת בטיחות',
            'ועדת הבתיכות': 'ועדת הבטיחות',
            'נאמן בתיכות': 'נאמן בטיחות',
            'נאמני בתיכות': 'נאמני בטיחות'
        }
        
        # Load custom vocabulary
        self.vocab_file = Path('src/scripts/video/custom_vocab.txt')
        self.custom_terms = []
        if self.vocab_file.exists():
            with open(self.vocab_file, 'r', encoding='utf-8') as f:
                self.custom_terms = [line.strip() for line in f if line.strip()]
        
        # Check for GPU support
        import torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")
        
        # Load Whisper model - using medium for initial testing
        try:
            print("Loading Whisper medium model...")
            self.model = whisper.load_model("medium", device=self.device)
            print("✓ Loaded Whisper medium model successfully")
        except Exception as e:
            print(f"Warning: Could not load model with {self.device}, falling back to CPU")
            self.model = whisper.load_model("medium", device="cpu")
        
    def load_progress(self) -> Dict:
        """Load or create progress tracking file."""
        if self.progress_file.exists():
            with open(self.progress_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            'downloaded': [],
            'transcribed': [],
            'failed': []
        }
        
    def save_progress(self):
        """Save current progress."""
        with open(self.progress_file, 'w', encoding='utf-8') as f:
            json.dump(self.progress, f, ensure_ascii=False, indent=2)

    def get_all_folders(self) -> List[Dict]:
        """Get all folders from the account."""
        print("\n📁 Fetching all folders...")
        folders = []
        target_folders = set(str(i) for i in range(1, 28))
        page = 1
        
        while True:
            try:
                response = self.client.get(f'/me/projects?page={page}&per_page=100')
                data = response.json()
                
                if not data.get('data'):
                    break
                    
                for folder in data['data']:
                    folder_name = folder.get('name', 'Untitled')
                    if folder_name in target_folders:
                        folders.append(folder)
                        folder_id = folder['uri'].split('/')[-1]
                        print(f"  - Found target folder: {folder_name} (ID: {folder_id})")
                        self.folders_cache[folder_id] = folder
                        target_folders.remove(folder_name)
                
                if not data.get('paging', {}).get('next'):
                    break
                    
                page += 1
                
            except Exception as e:
                print(f"Error fetching folders: {str(e)}")
                break
                
        return folders

    def get_video_download_link(self, video_uri: str) -> str:
        """Get the download link for a video."""
        try:
            response = self.client.get(f"{video_uri}")
            data = response.json()
            
            # Get the best quality download link
            files = data.get('download', [])
            if not files:
                return None
                
            # Sort by quality and get the best one
            files.sort(key=lambda x: x.get('width', 0), reverse=True)
            return files[0].get('link')
            
        except Exception as e:
            print(f"Error getting download link: {str(e)}")
            return None

    def download_video(self, video_uri: str, video_name: str) -> str:
        """Download a video from Vimeo."""
        # Use video ID for filename instead of Hebrew name
        video_id = video_uri.split('/')[-1]
        output_path = self.download_dir / f"video_{video_id}.mp4"
        
        if video_uri in self.progress['downloaded']:
            print(f"  ⏩ Already downloaded: {video_name}")
            if output_path.exists():  # Add check if file actually exists
                return str(output_path.absolute())  # Use absolute path
            else:
                print(f"  ⚠️ Warning: File marked as downloaded but not found, will download again")
                self.progress['downloaded'].remove(video_uri)
                
        download_link = self.get_video_download_link(video_uri)
        if not download_link:
            print(f"  ❌ No download link found for: {video_name}")
            self.progress['failed'].append(video_uri)
            self.save_progress()
            return None
        
        try:
            print(f"  ⬇️ Downloading: {video_name}")
            print(f"  📂 Saving to: {output_path.absolute()}")
            
            response = requests.get(download_link, stream=True)
            total_size = int(response.headers.get('content-length', 0))
            
            with open(output_path, 'wb') as f, tqdm(
                desc=video_name,
                total=total_size,
                unit='iB',
                unit_scale=True,
                unit_divisor=1024,
            ) as pbar:
                for data in response.iter_content(chunk_size=1024):
                    size = f.write(data)
                    pbar.update(size)
            
            self.progress['downloaded'].append(video_uri)
            self.save_progress()
            return str(output_path.absolute())  # Use absolute path
            
        except Exception as e:
            print(f"  ❌ Error downloading {video_name}: {str(e)}")
            self.progress['failed'].append(video_uri)
            self.save_progress()
            return None

    def correct_hebrew_text(self, text: str) -> str:
        """Apply corrections to common Hebrew transcription errors."""
        corrected = text
        
        # Apply word-level corrections
        for wrong, right in self.hebrew_corrections.items():
            corrected = corrected.replace(wrong, right)
        
        # Add space after Hebrew period if missing
        corrected = corrected.replace('.','. ')
        
        # Fix double spaces
        corrected = ' '.join(corrected.split())
        
        return corrected

    def transcribe_video(self, video_path: str, video_uri: str, video_name: str) -> Dict:
        """Transcribe a video using Whisper."""
        video_id = video_uri.split('/')[-1]
        transcript_path = self.transcripts_dir / f"transcript_{video_id}.json"
        video_path = Path(video_path)  # Convert to Path object
        
        if video_uri in self.progress['transcribed']:
            print(f"  ⏩ Already transcribed: {video_name}")
            if transcript_path.exists():
                with open(transcript_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return None
            
        try:
            print(f"  🎯 Transcribing: {video_name}")
            print(f"  📂 Video file: {video_path.absolute()}")
            
            if not video_path.exists():
                raise FileNotFoundError(f"Video file not found: {video_path.absolute()}")
            
            # Use all custom terms and phrases as context
            initial_prompt = "שיעור בנושא בטיחות. " + " ".join(self.custom_terms)
            print(f"  📝 Using context: {initial_prompt[:100]}...")
            
            # Transcribe with custom settings
            result = self.model.transcribe(
                str(video_path),
                language="he",  # Specify Hebrew
                initial_prompt=initial_prompt,
                condition_on_previous_text=True,
                temperature=0.2,  # Lower temperature for more focused predictions
                best_of=3,  # Try more samples for better accuracy
                fp16=self.device == "cuda",  # Use FP16 only on GPU
                task="transcribe"  # Explicitly set task
            )
            
            # Post-process transcription to prefer domain terms and fix common errors
            for segment in result["segments"]:
                # Apply corrections to the text
                segment["text"] = self.correct_hebrew_text(segment["text"])
            
            # Also correct the full text
            result["text"] = self.correct_hebrew_text(result["text"])
            
            # Structure the results
            transcript_data = {
                "video_uri": video_uri,
                "video_name": video_name,
                "video_id": video_id,
                "transcript_segments": result["segments"],
                "text": result["text"]
            }
            
            # Save transcript
            with open(transcript_path, 'w', encoding='utf-8') as f:
                json.dump(transcript_data, f, ensure_ascii=False, indent=2)
            
            self.progress['transcribed'].append(video_uri)
            self.save_progress()
            
            # Optionally remove the video file to save space
            try:
                video_path.unlink()
                print(f"  🗑️ Removed downloaded video to save space")
            except Exception as e:
                print(f"  ⚠️ Could not remove video file: {str(e)}")
            
            return transcript_data
            
        except Exception as e:
            print(f"  ❌ Error transcribing {video_name}: {str(e)}")
            print(f"  📂 Debug - Current working directory: {os.getcwd()}")
            print(f"  📂 Debug - Video path: {video_path.absolute()}")
            print(f"  📂 Debug - Video exists: {video_path.exists()}")
            self.progress['failed'].append(video_uri)
            self.save_progress()
            return None

    def process_videos(self, batch_size: int = None):
        """Process all videos: download and transcribe."""
        # Create directories if they don't exist
        self.download_dir.mkdir(exist_ok=True)
        self.transcripts_dir.mkdir(exist_ok=True)
        
        # Get all videos from target folders
        all_videos = []
        folders = self.get_all_folders()
        
        for folder in folders:
            folder_id = folder['uri'].split('/')[-1]
            try:
                response = self.client.get(f'/me/projects/{folder_id}/items')
                data = response.json()
                
                for item in data.get('data', []):
                    if item['type'] == 'video':
                        video_data = item.get('video', {})
                        if video_data and video_data.get('uri'):
                            all_videos.append(video_data)
                            
            except Exception as e:
                print(f"Error getting folder contents: {str(e)}")
        
        print(f"\n📹 Found {len(all_videos)} total videos")
        
        if batch_size:
            # Filter out already processed videos
            pending_videos = [v for v in all_videos 
                            if v['uri'] not in self.progress['transcribed']
                            and v['uri'] not in self.progress['failed']]
            videos_to_process = pending_videos[:batch_size]
            print(f"Processing batch of {len(videos_to_process)} videos")
        else:
            videos_to_process = all_videos
        
        for video in videos_to_process:
            video_name = video.get('name', 'Untitled')
            video_uri = video['uri']
            
            print(f"\nProcessing: {video_name}")
            
            # Download
            video_path = self.download_video(video_uri, video_name)
            if not video_path:
                continue
                
            # Transcribe
            transcript = self.transcribe_video(video_path, video_uri, video_name)
            if transcript:
                print(f"  ✅ Successfully processed: {video_name}")
            
            # Optional: Remove downloaded video to save space
            # os.remove(video_path)
        
        # Print summary
        print("\n=== Summary ===")
        print(f"Total videos found: {len(all_videos)}")
        print(f"Successfully downloaded: {len(self.progress['downloaded'])}")
        print(f"Successfully transcribed: {len(self.progress['transcribed'])}")
        print(f"Failed: {len(self.progress['failed'])}")
        
        if self.progress['failed']:
            print("\nFailed videos:")
            for video_uri in self.progress['failed']:
                print(f"- {video_uri}")

def main():
    """Main entry point of the script."""
    access_token = os.getenv('VIMEO_ACCESS_TOKEN')
    
    if not access_token:
        print("Error: VIMEO_ACCESS_TOKEN not found in environment or .env file")
        print("Please create a .env file in the project root with:")
        print("VIMEO_ACCESS_TOKEN=your_token_here")
        sys.exit(1)
    
    processor = VideoProcessor(access_token)
    
    # Get all folders
    folders = processor.get_all_folders()
    if not folders:
        print("No folders found!")
        return
    
    # Process all folders
    all_videos = []
    for folder in folders:
        folder_id = folder['uri'].split('/')[-1]
        try:
            print(f"\nFetching videos from folder: {folder['name']}")
            response = processor.client.get(f'/me/projects/{folder_id}/items')
            data = response.json()
            
            for item in data.get('data', []):
                if item['type'] == 'video':
                    video_data = item.get('video', {})
                    if video_data and video_data.get('uri'):
                        all_videos.append(video_data)
                        video_name = video_data.get('name', 'Untitled')
                        video_uri = video_data['uri']
                        
                        print(f"\nDownloading video: {video_name}")
                        # Only download, don't transcribe
                        processor.download_video(video_uri, video_name)
                        
        except Exception as e:
            print(f"Error processing folder: {str(e)}")
    
    print(f"\n=== Download Summary ===")
    print(f"Total videos found: {len(all_videos)}")
    print(f"Successfully downloaded: {len(processor.progress['downloaded'])}")
    print(f"Failed: {len(processor.progress['failed'])}")
    
    if processor.progress['failed']:
        print("\nFailed videos:")
        for video_uri in processor.progress['failed']:
            print(f"- {video_uri}")

if __name__ == "__main__":
    main() 