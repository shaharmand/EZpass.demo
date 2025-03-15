import os
import json
import time
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from docx import Document
from dotenv import load_dotenv
import random  # Add at the top with other imports

# Load environment variables
load_dotenv()

# If modifying these scopes, delete the file token.json.
SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.force-ssl'
]

# Directory paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
VIDEOS_DIR = PROJECT_ROOT / 'data' / 'Videos' / 'downloaded_videos'
SUMMARIES_DIR = PROJECT_ROOT / 'data' / 'Videos' / 'Videos_summaries'

def get_youtube_client():
    """Get authenticated YouTube client with better error handling."""
    creds = None
    token_file = Path(__file__).parent / 'token.json'
    secrets_file = Path(__file__).parent / 'client_secrets.json'

    if not secrets_file.exists():
        print("❌ Error: client_secrets.json not found!")
        print("Please ensure client_secrets.json is in the same directory as this script.")
        return None

    # Check for existing token
    if token_file.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
            print("📝 Found existing credentials")
        except Exception as e:
            print(f"⚠️ Error reading token file: {e}")
            creds = None
    
    # If no valid credentials available, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired credentials...")
            try:
                creds.refresh(Request())
                print("✅ Credentials refreshed successfully")
            except Exception as e:
                print(f"❌ Error refreshing credentials: {e}")
                creds = None
        
        if not creds:
            print("\n🔐 No valid credentials found. Starting OAuth flow...")
            print("A browser window will open for authentication.")
            print("Please log in with your Google account and grant the required permissions.")
            
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(secrets_file), 
                    SCOPES
                )
                # Let the flow handle the redirect URI automatically
                creds = flow.run_local_server(
                    port=0,  # Let it pick an available port
                    open_browser=True
                )
                print("✅ Authentication successful!")
            except Exception as e:
                print(f"❌ Authentication failed: {e}")
                return None

        # Save the credentials for future runs
        try:
            with open(token_file, 'w') as token:
                token.write(creds.to_json())
            print("💾 Credentials saved for future use")
        except Exception as e:
            print(f"⚠️ Warning: Could not save credentials: {e}")

    try:
        # Build the YouTube service
        youtube = build('youtube', 'v3', credentials=creds)
        
        # Test the connection
        youtube.channels().list(
            part='snippet',
            mine=True
        ).execute()
        
        print("✅ YouTube API connection successful!")
        return youtube
    except HttpError as e:
        print(f"❌ YouTube API error: {e.error_details[0]['message'] if e.error_details else str(e)}")
        return None
    except Exception as e:
        print(f"❌ Error building YouTube client: {e}")
        return None

def load_video_data():
    """Load existing video data with error handling."""
    try:
        project_root = Path(__file__).parent.parent.parent.parent
        video_data_path = project_root / 'public' / 'data' / 'courses' / 'construction_safety_video_course' / 'video_data.json'
        
        if not video_data_path.exists():
            print(f"❌ Error: Video data file not found at {video_data_path}")
            return None
            
        with open(video_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"📚 Loaded {len(data.get('videos', []))} videos from data file")
            return data
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing video data JSON: {e}")
        return None
    except Exception as e:
        print(f"❌ Error loading video data: {e}")
        return None

def update_video_mapping(video_id, youtube_id):
    """Update the mapping between Vimeo and YouTube IDs."""
    mapping_file = Path(__file__).parent / 'youtube_video_mapping.json'
    
    try:
        if mapping_file.exists():
            with open(mapping_file, 'r', encoding='utf-8') as f:
                mapping = json.load(f)
        else:
            mapping = {}
        
        mapping[video_id] = youtube_id
        
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping, f, indent=2, ensure_ascii=False)
        print(f"✅ Updated mapping: Vimeo ID {video_id} → YouTube ID {youtube_id}")
    except Exception as e:
        print(f"⚠️ Warning: Could not update video mapping: {e}")

def get_topic_info(lesson_number):
    """Get topic information for a lesson number."""
    project_root = Path(__file__).parent.parent.parent.parent
    lesson_info_path = project_root / 'public' / 'data' / 'lesson_info.json'
    
    try:
        with open(lesson_info_path, 'r', encoding='utf-8') as f:
            lesson_data = json.load(f)
            
        # Find which topic contains this lesson
        for topic in lesson_data['topics']:
            if lesson_number in topic['lessons']:
                return {
                    'id': topic['id'],
                    'title': topic['title']
                }
        return None
    except Exception as e:
        print(f"⚠️ Warning: Could not load topic info: {e}")
        return None

def get_lesson_info(lesson_number):
    """Get lesson information from lesson_info.json."""
    project_root = Path(__file__).parent.parent.parent.parent
    lesson_info_path = project_root / 'public' / 'data' / 'lesson_info.json'
    
    try:
        with open(lesson_info_path, 'r', encoding='utf-8') as f:
            lesson_data = json.load(f)
            
        # Find lesson info
        for lesson in lesson_data['lessons']:
            if lesson['id'] == lesson_number:
                return lesson
        return None
    except Exception as e:
        print(f"⚠️ Warning: Could not load lesson info: {e}")
        return None

def get_video_summary(lesson_number, segment_number):
    """Get the content of the Word document summary for a specific lesson."""
    try:
        # Format the lesson number for file matching
        summary_pattern = f"שיעור {lesson_number}.{segment_number}"
        
        # Look for a matching file in the summaries directory
        for file in SUMMARIES_DIR.glob('*.docx'):
            if summary_pattern in file.name:
                doc = Document(file)
                # Extract text from the document
                text = []
                for paragraph in doc.paragraphs:
                    if paragraph.text.strip():
                        text.append(paragraph.text.strip())
                return '\n'.join(text)
        return None
    except Exception as e:
        print(f"⚠️ Warning: Could not load summary for lesson {lesson_number}.{segment_number}: {e}")
        return None

def upload_video(youtube, video_path, video_info):
    """Upload a video to YouTube with progress reporting."""
    try:
        # Get lesson and topic information
        lesson_info = get_lesson_info(video_info['lessonNumber'])
        topic_info = get_topic_info(video_info['lessonNumber'])
        
        lesson_name = lesson_info['name'] if lesson_info else ""
        topic_name = topic_info['title'] if topic_info else ""
        
        # Format title prioritizing the specific video content
        title = f"{video_info['title']} | שיעור {video_info['lessonNumber']}.{video_info['segmentNumber']} | {topic_name}"
        
        # Enhanced description optimized for slide detection
        description = f"""קורס בטיחות בבניה | Construction Safety Course

נושא השיעור: {topic_name}
שיעור {video_info['lessonNumber']}.{video_info['segmentNumber']}: {video_info['title']}

[Slide-Based Lecture]
This educational video consists of presentation slides about construction safety.
Each slide transition represents a new subtopic or key concept.
YouTube's auto-chapters will help you navigate between slides.

Key Topics (מונחי מפתח):
• {video_info['title']}
• {topic_name}
• בטיחות בעבודה
• תקנות בטיחות

#בטיחותבבניה #הדרכתבטיחות #שיעור_{video_info['lessonNumber']}"""
        
        body = {
            'snippet': {
                'title': title,
                'description': description,
                'tags': [
                    'בטיחות בבניה',
                    'בטיחות בעבודה',
                    'תקנות בטיחות',
                    'חוק ארגון הפיקוח',
                    'מנהל עבודה',
                    'אחראי בטיחות',
                    'construction safety',
                    'work safety',
                    'safety regulations',
                    'site manager',
                    'safety supervisor',
                    'slide presentation',  # Added for better content identification
                    'educational slides',   # Added for better content identification
                    f'שיעור_{video_info["lessonNumber"]}',
                    topic_info['id'] if topic_info else ''
                ],
                'defaultLanguage': 'he',
                'defaultAudioLanguage': 'he',
                'categoryId': '27'  # Education category
            },
            'status': {
                'privacyStatus': 'unlisted',
                'selfDeclaredMadeForKids': False,
                'license': 'youtube',
                'embeddable': True  # Allow embedding for better integration
            },
            'contentDetails': {
                'enableAutoChapters': True,     # Enable automatic chapter detection
                'enableKeyMoments': True,       # Enable key moments for slide transitions
                'autoLevels': False,           # Disable auto-leveling to preserve slide clarity
                'definition': 'high'           # Ensure high quality for slide text readability
            }
        }

        # Configure upload with larger chunk size for faster upload
        request = youtube.videos().insert(
            part=','.join(body.keys()),
            body=body,
            media_body=MediaFileUpload(
                video_path,
                chunksize=10 * 1024 * 1024,  # 10MB chunks
                resumable=True
            )
        )
        
        # Upload with progress reporting
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                print(f"⏳ Uploaded {int(status.progress() * 100)}%")
        
        print(f"✅ Upload complete! Video ID: {response['id']}")
        
        # Enable auto-chapters and key moments via separate API call
        youtube.videos().update(
            part="contentDetails",
            body={
                "id": response['id'],
                "contentDetails": {
                    "enableAutoChapters": True,
                    "enableKeyMoments": True,
                    "autoLevels": False,
                    "definition": "high"
                }
            }
        ).execute()
        
        print("✅ Enhanced settings applied for slide detection")
        return response['id']
    except HttpError as e:
        print(f"❌ An HTTP error {e.resp.status} occurred: {e.content}")
        return None
    except Exception as e:
        print(f"❌ A general error occurred: {e}")
        return None

def get_video_transcript(youtube, video_id):
    """Fetch the transcript for a video with retries."""
    max_retries = 3
    retry_delay = 30  # seconds
    
    for attempt in range(max_retries):
        try:
            captions = youtube.captions().list(
                part='snippet',
                videoId=video_id
            ).execute()

            if not captions.get('items'):
                if attempt < max_retries - 1:
                    print(f"⏳ No captions available yet, waiting {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                return None

            caption_id = captions['items'][0]['id']
            subtitle = youtube.captions().download(
                id=caption_id,
                tfmt='srt'
            ).execute()

            return subtitle
        except HttpError as e:
            if 'processingFailure' in str(e) and attempt < max_retries - 1:
                print(f"⏳ Captions still processing, waiting {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            print(f"❌ YouTube API error fetching transcript: {e.error_details[0]['message'] if e.error_details else str(e)}")
            return None
        except Exception as e:
            print(f"❌ Error fetching transcript: {e}")
            return None

def get_video_path(video_id):
    """Get the path to a video file."""
    # Try both with and without "video_" prefix
    video_paths = [
        VIDEOS_DIR / f"video_{video_id}.mp4",
        VIDEOS_DIR / f"{video_id}.mp4"
    ]
    for path in video_paths:
        if path.exists():
            return str(path)
    return None

def check_video_status(youtube, video_id):
    """Check detailed processing status of a video, including captions"""
    try:
        # Get processing status
        video_response = youtube.videos().list(
            part="processingDetails,status,contentDetails",
            id=video_id
        ).execute()
        
        if video_response["items"]:
            video = video_response["items"][0]
            processing = video["processingDetails"]
            
            print("\nProcessing Status:")
            print(f"Processing Status: {processing['processingStatus']}")
            print(f"Processing Progress: {processing.get('processingProgress', {}).get('partsProcessed', 0)}/{processing.get('processingProgress', {}).get('partsTotal', 0)}")
            
            # Check caption status
            if "caption" in processing:
                print(f"\nCaption Status:")
                print(f"Available: {processing['caption']['available']}")
                print(f"Processing State: {processing['caption']['processingState']}")
            
            # Check if auto-captions are being generated
            captions_response = youtube.captions().list(
                part="snippet",
                videoId=video_id
            ).execute()
            
            if captions_response.get("items"):
                print("\nCaptions:")
                for caption in captions_response["items"]:
                    print(f"Language: {caption['snippet']['language']}")
                    print(f"Status: {caption['snippet']['status']}")
            else:
                print("\nNo captions found yet - they may still be processing")
                
            return processing['processingStatus']
    except Exception as e:
        print(f"Error checking status: {str(e)}")
        return None

def monitor_processing(youtube, uploaded_videos, timeout_minutes=15):
    """Monitor processing status of videos until complete or timeout."""
    start_time = time.time()
    timeout_seconds = timeout_minutes * 60
    pending_videos = set(uploaded_videos)
    
    while pending_videos and (time.time() - start_time) < timeout_seconds:
        print(f"\nChecking processing status at {time.strftime('%H:%M:%S')}:")
        for youtube_id in list(pending_videos):  # Convert to list to allow set modification
            print(f"\nVideo ID: {youtube_id}")
            status = check_video_status(youtube, youtube_id)
            
            # If processing is complete and captions are available, remove from pending
            if status == "processed":
                try:
                    captions = youtube.captions().list(
                        part="snippet",
                        videoId=youtube_id
                    ).execute()
                    if captions.get("items"):
                        print("✅ Video fully processed with captions")
                        pending_videos.remove(youtube_id)
                    else:
                        print("⏳ Captions still processing...")
                except Exception as e:
                    print(f"Error checking captions: {str(e)}")
        
        if pending_videos:
            print(f"\nStill waiting for {len(pending_videos)} videos to complete processing...")
            print("Checking again in 60 seconds...")
            time.sleep(60)
    
    if pending_videos:
        print("\n⚠️ Timeout reached. Some videos may still be processing:")
        for youtube_id in pending_videos:
            print(f"- {youtube_id}")
    else:
        print("\n✅ All videos fully processed!")

def main():
    print("\n🎥 YouTube Video Uploader and Transcript Fetcher")
    print("==============================================\n")
    
    # Initialize YouTube client
    youtube = get_youtube_client()
    if not youtube:
        print("❌ Failed to initialize YouTube client")
        return

    # Load video data
    video_data = load_video_data()
    if not video_data:
        return
    
    # Select 4 random videos from different parts of the course
    all_videos = video_data['videos']  # This is already a list
    total_videos = len(all_videos)
    
    if total_videos < 4:
        print("❌ Not enough videos available for testing")
        return
        
    # Divide videos into 4 quarters and pick one from each
    quarter_size = total_videos // 4
    test_videos = []
    for i in range(4):
        start_idx = i * quarter_size
        end_idx = start_idx + quarter_size if i < 3 else total_videos
        quarter_videos = all_videos[start_idx:end_idx]
        test_videos.append(random.choice(quarter_videos))
    
    print(f"Selected {len(test_videos)} test videos from different parts of the course:")
    for video in test_videos:
        print(f"- Lesson {video['lessonNumber']}.{video['segmentNumber']}: {video['title']}")
    
    uploaded_videos = []
    
    for video in test_videos:
        video_path = get_video_path(video['vimeoId'])
        if not video_path:
            print(f"Video file not found for Vimeo ID: {video['vimeoId']}")
            continue
            
        print(f"\nProcessing video: {video['title']}")
        print(f"File path: {video_path}")
        
        try:
            youtube_id = upload_video(youtube, video_path, video)
            if youtube_id:
                print(f"Successfully uploaded video. YouTube ID: {youtube_id}")
                uploaded_videos.append(youtube_id)
                
                print("\nInitial processing check:")
                check_video_status(youtube, youtube_id)
                
        except Exception as e:
            print(f"Error uploading video: {str(e)}")
            continue
    
    if uploaded_videos:
        print("\nStarting continuous monitoring of video processing...")
        monitor_processing(youtube, uploaded_videos)
            
    print("\nTest upload complete. Please check the uploaded videos on YouTube.")

if __name__ == '__main__':
    main() 