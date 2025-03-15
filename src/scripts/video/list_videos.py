#!/usr/bin/env python3
import os
import vimeo
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from collections import defaultdict

# Load environment variables from .env file
load_dotenv()

# Load the proper subtopic mapping
try:
    # Try relative to script location first
    script_dir = Path(__file__).parent
    mapping_file = script_dir / 'folder_subtopic_mapping.json'
    with open(mapping_file, 'r', encoding='utf-8') as f:
        FOLDER_TO_SUBTOPIC = json.load(f)
except FileNotFoundError:
    print(f"Error: Could not find mapping file at {mapping_file}")
    exit(1)

def parse_video_title(title):
    """Extract lesson and segment numbers from video title."""
    # Try different patterns
    patterns = [
        r'(\d+)\.(\d+)\s*-?\s*(.+)',  # Matches: "1.2 - Title" or "1.2 Title"
        r'(\d+)\.(\d+)$',             # Matches: "1.2"
        r'lesson\s*(\d+)\.(\d+)\s*-?\s*(.+)',  # Matches: "Lesson 1.2 - Title"
        r'שיעור\s*(\d+)\.(\d+)\s*-?\s*(.+)',   # Matches Hebrew: "שיעור 1.2 - Title"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, title.lower())
        if match:
            lesson_num = int(match.group(1))
            segment_num = int(match.group(2))
            title_text = match.group(3).strip() if len(match.groups()) > 2 else title
            if lesson_num > 27:
                print(f"Warning: Found lesson number > 27: {title} -> Lesson {lesson_num}")
            return lesson_num, segment_num, title_text
            
    print(f"Warning: Could not parse lesson/segment from title: {title}")
    return None, None, title

# Get token from environment
token = os.getenv('VIMEO_ACCESS_TOKEN')
if not token:
    print("No Vimeo access token found!")
    exit(1)

print(f"\nUsing token: {token[:5]}...")  # Show first 5 chars of token

# Initialize client
client = vimeo.VimeoClient(token=token)

# First verify we can access the account
print("\nVerifying account access...")
try:
    me_response = client.get('/me')
    me_data = me_response.json()
    print(f"Connected as: {me_data.get('name', 'Unknown')}")
except Exception as e:
    print(f"Error accessing account: {str(e)}")
    print("Full response:", me_response.text if hasattr(me_response, 'text') else 'No response text')
    exit(1)

print("\nFetching videos from your library...")
all_videos = []

try:
    # Get all folders first
    print("\nFetching folders...")
    folders_response = client.get('/me/folders?per_page=100')  # Ensure we get all folders
    folders_data = folders_response.json()
    
    if 'data' in folders_data:
        print(f"Found {len(folders_data['data'])} folders:")
        for folder in folders_data['data']:
            folder_name = folder.get('name', 'Untitled')
            folder_id = folder['uri'].split('/')[-1]
            print(f"- Folder: {folder_name} (ID: {folder_id})")
            
            # Get subtopic ID from mapping
            subtopic_id = FOLDER_TO_SUBTOPIC.get(folder_name, folder_name.lower())
            print(f"\nProcessing folder: {folder_name} (subtopic: {subtopic_id})")
            
            # Get videos in this folder
            try:
                videos_response = client.get(f'/me/folders/{folder_id}/videos?per_page=100')
                videos_data = videos_response.json()
                videos = videos_data.get('data', [])
                print(f"Found {len(videos)} videos")
                
                for video in videos:
                    video_title = video.get('name', 'Untitled')
                    video_id = video['uri'].split('/')[-1]
                    lesson_num, segment_num, cleaned_title = parse_video_title(video_title)
                    
                    if lesson_num is not None and segment_num is not None:
                        video_info = {
                            'id': f"video_{video_id}",
                            'vimeoId': video_id,
                            'originalTitle': video_title,  # Keep original title
                            'title': cleaned_title,        # Keep cleaned title
                            'course': "construction_safety",
                            'lessonNumber': lesson_num,
                            'segmentNumber': segment_num,
                            'subtopicId': subtopic_id,
                            'embedUrl': f"https://player.vimeo.com/video/{video_id}"
                        }
                        all_videos.append(video_info)
                        print(f"  - Original: {video_title}")
                        print(f"    Parsed: Lesson {lesson_num}.{segment_num} - {cleaned_title}")
                    else:
                        print(f"  ⚠️ Skipped {video_title} - Could not determine lesson/segment numbers")
                    
            except Exception as e:
                print(f"  Error getting videos from folder: {str(e)}")
    else:
        print("No folders found in response!")
        print("Response data:", folders_data)
    
    # Save to JSON file
    project_root = Path(__file__).parent.parent.parent
    output_dir = project_root / 'public' / 'data' / 'courses' / 'construction_safety_video_course'
    output_dir.mkdir(parents=True, exist_ok=True)  # Create directory if it doesn't exist
    output_file = output_dir / 'video_data.json'
    
    print(f"\nSaving to: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_videos, f, ensure_ascii=False, indent=2)
    
    print(f"Processed {len(all_videos)} videos")
    print(f"Data saved to {output_file}")
    
    # Analyze video distribution
    analyze_video_distribution(all_videos)
            
except Exception as e:
    print(f"Error: {str(e)}")

print("\nDone!")

def analyze_video_distribution(videos):
    """Analyze the distribution of videos across lessons and find gaps."""
    lesson_counts = defaultdict(int)
    for video in videos:
        lesson_counts[video['lessonNumber']] += 1
    
    # Find gaps in lesson numbers
    all_lessons = sorted(lesson_counts.keys())
    if all_lessons:
        min_lesson = min(all_lessons)
        max_lesson = max(all_lessons)
        missing_lessons = [i for i in range(min_lesson, max_lesson + 1) 
                         if i not in lesson_counts]
        
        print("\nVideo Distribution Analysis:")
        print("----------------------------")
        print(f"Total videos found: {len(videos)}")
        print(f"Number of lessons: {len(lesson_counts)}")
        print(f"Lesson range: {min_lesson} to {max_lesson}")
        
        if missing_lessons:
            print(f"\nMissing lesson numbers: {missing_lessons}")
        
        print("\nVideos per lesson:")
        total = 0
        for lesson in sorted(lesson_counts.keys()):
            count = lesson_counts[lesson]
            total += count
            print(f"Lesson {lesson}: {count} videos")
        print(f"\nSum of all videos: {total}")
        
        # Print any videos with lesson numbers > 27
        high_lesson_videos = [v for v in videos if v['lessonNumber'] > 27]
        if high_lesson_videos:
            print("\nVideos with lesson numbers > 27:")
            for v in high_lesson_videos:
                print(f"  - {v['originalTitle']} (Lesson {v['lessonNumber']})")
            
        return lesson_counts
    return None 