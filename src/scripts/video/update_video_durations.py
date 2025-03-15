#!/usr/bin/env python3
import os
import json
import vimeo
import time
from pathlib import Path
from dotenv import load_dotenv

def load_video_data():
    """Load the existing video_data.json file."""
    data_file = Path("public/data/courses/construction_safety_video_course/video_data.json")
    if not data_file.exists():
        raise FileNotFoundError("video_data.json not found")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_video_data(data):
    """Save the updated video data back to JSON file."""
    data_file = Path("public/data/courses/construction_safety_video_course/video_data.json")
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_video_duration(client, video_id):
    """Get video duration from Vimeo API."""
    try:
        response = client.get(f'/videos/{video_id}')
        video_data = response.json()
        duration = video_data.get('duration', 0)
        return round(duration / 60, 1)  # Convert seconds to minutes and round to 1 decimal
    except Exception as e:
        print(f"Error getting duration for video {video_id}: {str(e)}")
        return None

def main():
    """Main entry point of the script."""
    # Load environment variables
    load_dotenv()
    access_token = os.getenv('VIMEO_ACCESS_TOKEN')
    
    if not access_token:
        print("Error: VIMEO_ACCESS_TOKEN not found in environment or .env file")
        print("Please create a .env file in the project root with:")
        print("VIMEO_ACCESS_TOKEN=your_token_here")
        return
    
    # Initialize Vimeo client
    client = vimeo.VimeoClient(token=access_token)
    
    try:
        # Load existing video data
        print("\nLoading existing video data...")
        video_data = load_video_data()
        
        # Update durations for all videos
        print("\nFetching video durations from Vimeo...")
        total_videos = len(video_data['videos'])
        
        for i, video in enumerate(video_data['videos'], 1):
            vimeo_id = video['vimeoId']
            print(f"Processing video {i}/{total_videos}: {video['title']} (ID: {vimeo_id})")
            
            # Get duration from Vimeo
            duration = get_video_duration(client, vimeo_id)
            
            if duration is not None:
                video['duration'] = duration
                print(f"  ✓ Duration: {duration} minutes")
            else:
                print(f"  ✗ Failed to get duration")
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.1)
        
        # Save updated data
        print("\nSaving updated video data...")
        save_video_data(video_data)
        
        print("\n✅ Successfully updated video durations!")
        print(f"Total videos processed: {total_videos}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    main() 