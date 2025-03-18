import os
import json
import time
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# If modifying these scopes, delete the file token.json.
SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
]

def get_youtube_client():
    """Get authenticated YouTube client."""
    creds = None
    token_file = Path(__file__).parent / 'token.json'
    secrets_file = Path(__file__).parent / 'client_secrets.json'

    if not secrets_file.exists():
        print("❌ Error: client_secrets.json not found!")
        return None

    if token_file.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
            print("📝 Found existing credentials")
        except Exception as e:
            print(f"⚠️ Error reading token file: {e}")
            creds = None
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None
                flow = InstalledAppFlow.from_client_secrets_file(str(secrets_file), SCOPES)
                creds = flow.run_local_server(port=0)
            with open(token_file, 'w') as token:
                token.write(creds.to_json())

    try:
        youtube = build('youtube', 'v3', credentials=creds)
        print("✅ YouTube API connection successful!")
        return youtube
    except Exception as e:
        print(f"❌ Error building YouTube client: {e}")
        return None

def parse_upload_progress():
    """Parse the upload progress file and return a list of uploaded videos."""
    mapping_file = Path(__file__).parent.parent.parent / 'data' / 'videos' / 'youtube' / 'video_mapping.json'
    uploaded_videos = []
    
    if not mapping_file.exists():
        print("❌ Video mapping file not found!")
        return uploaded_videos
        
    with open(mapping_file, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
        for vimeo_id, info in mapping['video_info'].items():
            uploaded_videos.append({
                'vimeo_id': vimeo_id,
                'youtube_id': info['youtube_id'],
                'title': info['title']
            })
    
    return uploaded_videos

def get_video_details(youtube, video_id):
    """Get detailed information about a video."""
    try:
        # Get video information
        video_response = youtube.videos().list(
            part="snippet,contentDetails,statistics,processingDetails",
            id=video_id
        ).execute()
        
        if not video_response.get("items"):
            return None
            
        video = video_response["items"][0]
        
        # Get captions
        captions_response = youtube.captions().list(
            part="snippet",
            videoId=video_id
        ).execute()
        
        # Get chapters from description
        description = video["snippet"]["description"]
        chapters = []
        if "Chapters:" in description:
            chapters_text = description.split("Chapters:")[1].strip()
            for line in chapters_text.split("\n"):
                if line.strip():
                    try:
                        time_str, title = line.split(" ", 1)
                        chapters.append({"time": time_str, "title": title.strip()})
                    except:
                        continue
        
        return {
            "id": video_id,
            "title": video["snippet"]["title"],
            "description": video["snippet"]["description"],
            "publishedAt": video["snippet"]["publishedAt"],
            "duration": video["contentDetails"]["duration"],
            "viewCount": video["statistics"].get("viewCount", "0"),
            "likeCount": video["statistics"].get("likeCount", "0"),
            "commentCount": video["statistics"].get("commentCount", "0"),
            "processingStatus": video["processingDetails"]["processingStatus"],
            "thumbnails": video["snippet"]["thumbnails"],
            "tags": video["snippet"].get("tags", []),
            "captions": [
                {
                    "language": caption["snippet"]["language"],
                    "status": caption["snippet"]["status"]
                }
                for caption in captions_response.get("items", [])
            ],
            "chapters": chapters
        }
    except HttpError as e:
        print(f"❌ HTTP error {e.resp.status} occurred: {e.content}")
        return None
    except Exception as e:
        print(f"❌ Error getting video details: {e}")
        return None

def main():
    print("\n📊 YouTube Video Status Checker")
    print("==============================\n")
    
    # Initialize YouTube client
    youtube = get_youtube_client()
    if not youtube:
        print("❌ Failed to initialize YouTube client")
        return

    # Get list of uploaded videos
    uploaded_videos = parse_upload_progress()
    print(f"Found {len(uploaded_videos)} uploaded videos")
    
    # Create output directory if it doesn't exist
    output_dir = Path(__file__).parent / 'video_status'
    output_dir.mkdir(exist_ok=True)
    
    # Process each video
    for video in uploaded_videos:
        print(f"\nProcessing: {video['title']}")
        print(f"YouTube ID: {video['youtube_id']}")
        
        details = get_video_details(youtube, video['youtube_id'])
        if details:
            # Save details to file
            output_file = output_dir / f"{video['youtube_id']}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(details, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Saved details to {output_file}")
            
            # Print summary
            print("\nSummary:")
            print(f"Processing Status: {details['processingStatus']}")
            print(f"Duration: {details['duration']}")
            print(f"Views: {details['viewCount']}")
            print(f"Likes: {details['likeCount']}")
            print(f"Comments: {details['commentCount']}")
            print(f"Captions: {len(details['captions'])}")
            print(f"Chapters: {len(details['chapters'])}")
        else:
            print("❌ Failed to get video details")
        
        # Add a small delay to avoid hitting API limits
        time.sleep(1)
    
    print("\n✨ Status check complete!")

if __name__ == '__main__':
    main() 