import vimeo
import json
import os
from dotenv import load_dotenv
from pathlib import Path
import glob
import time

load_dotenv()

def get_vimeo_client():
    # Load environment variables
    load_dotenv()
    
    # Get all OAuth credentials from .env file
    client_id = os.getenv('VIMEO_CLIENT_ID')
    client_secret = os.getenv('VIMEO_CLIENT_SECRET')
    access_token = os.getenv('VIMEO_ACCESS_TOKEN')
    
    if not all([client_id, client_secret, access_token]):
        print("\n❌ Missing Vimeo OAuth credentials!")
        print("Please ensure your .env file contains:")
        print("VIMEO_CLIENT_ID=your_client_id")
        print("VIMEO_CLIENT_SECRET=your_client_secret")
        print("VIMEO_ACCESS_TOKEN=your_access_token")
        return None
    
    print("\n🔐 OAuth Credentials:")
    print(f"   Client ID: {'*' * (len(client_id) - 4) + client_id[-4:]}")
    print(f"   Client Secret: {'*' * (len(client_secret) - 4) + client_secret[-4:]}")
    print(f"   Access Token: {'*' * (len(access_token) - 4) + access_token[-4:]}")
    
    try:
        # Initialize the client with full OAuth credentials
        client = vimeo.VimeoClient(
            token=access_token,
            key=client_id,
            secret=client_secret
        )
        
        # Test the client by making a simple API call
        test_response = client.get('/oauth/verify')
        if test_response.status_code == 200:
            user_info = test_response.json()
            print(f"\n✅ Successfully authenticated as: {user_info.get('user', {}).get('name')}")
            print(f"   Account type: {user_info.get('user', {}).get('account')}")
            print(f"   Token scopes: {user_info.get('scope', '')}")
        else:
            print(f"\n❌ Authentication test failed with status code: {test_response.status_code}")
            return None
            
        return client
    except Exception as e:
        print(f"\n❌ Failed to initialize Vimeo client: {str(e)}")
        return None

def get_current_privacy_settings(client, video_id):
    try:
        response = client.get(f'/videos/{video_id}')
        if response.status_code == 200:
            return response.json().get('privacy', {})
        return None
    except Exception as e:
        print(f"❌ Failed to get current privacy settings for video {video_id}: {str(e)}")
        return None

def update_video_privacy(client, video_id):
    # Add retry mechanism
    max_retries = 3
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            # First get current settings
            current_settings = get_current_privacy_settings(client, video_id)
            if current_settings is None:
                raise Exception("Could not fetch current settings")
            
            # Update basic privacy settings first
            privacy_data = {
                'privacy': {
                    'view': 'disable',     # Hide from Vimeo
                    'embed': 'public',     # Allow embedding anywhere
                    'download': False,
                    'add': False,
                    'comments': 'nobody'
                },
                'embed': {
                    'buttons': {
                        'like': False,
                        'watchlater': False,
                        'share': False,
                        'embed': False,
                    },
                    'logos': {
                        'vimeo': False,
                        'custom': {
                            'active': False
                        }
                    },
                    'title': {
                        'name': 'hide',
                        'owner': 'hide',
                        'portrait': 'hide'
                    }
                }
            }
            
            print(f"\nUpdating settings for video {video_id}")
            response = client.patch(f'/videos/{video_id}', data=privacy_data)
            
            if response.status_code != 200:
                print(f"Response content: {response.text}")
                raise Exception(f"Failed to update settings: {response.status_code}")
            
            # Verify the settings were applied correctly
            verify_response = client.get(f'/videos/{video_id}')
            if verify_response.status_code == 200:
                actual_settings = verify_response.json()
                privacy = actual_settings.get('privacy', {})
                embed = actual_settings.get('embed', {})
                
                print(f"\n✅ Updated video {video_id}:")
                print(f"   View: {privacy.get('view')}")
                print(f"   Embed: {privacy.get('embed')}")
                print(f"   Download: {privacy.get('download')}")
                print(f"   Comments: {privacy.get('comments')}")
                print(f"   Embed settings:")
                print(f"      - Buttons: {embed.get('buttons')}")
                print(f"      - Logos: {embed.get('logos')}")
                print(f"      - Title: {embed.get('title')}")
                print("   ----------------------")
            return True
                
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️ Attempt {attempt + 1} failed for video {video_id}: {str(e)}")
                print(f"   Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            else:
                print(f"❌ Failed to update privacy for video {video_id} after {max_retries} attempts: {str(e)}")
                return False

def get_all_video_ids():
    # Get the path to video directories
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    videos_root = project_root / 'public' / 'videos'
    
    # Dictionary to store all video IDs
    all_video_ids = set()
    
    # First, get videos from video_data.json
    video_data_path = project_root / 'public' / 'data' / 'courses' / 'construction_safety_video_course' / 'video_data.json'
    try:
        with open(video_data_path, 'r', encoding='utf-8') as f:
            video_data = json.load(f)
            for video in video_data:
                all_video_ids.add(video['vimeoId'])
    except Exception as e:
        print(f"Warning: Could not read video_data.json: {str(e)}")

    # Then scan through lesson directories
    for lesson_num in range(1, 28):  # 1 to 27
        lesson_dir = videos_root / str(lesson_num)
        if lesson_dir.exists():
            # Look for video info files
            info_files = glob.glob(str(lesson_dir / '**' / 'video_info.json'), recursive=True)
            for info_file in info_files:
                try:
                    with open(info_file, 'r', encoding='utf-8') as f:
                        video_info = json.load(f)
                        if 'vimeoId' in video_info:
                            all_video_ids.add(video_info['vimeoId'])
                except Exception as e:
                    print(f"Warning: Could not read {info_file}: {str(e)}")
    
    return list(all_video_ids)

def verify_token_scopes(client):
    try:
        # Get the token verification endpoint
        response = client.get('/oauth/verify')
        if response.status_code == 200:
            token_info = response.json()
            print("\nDetailed Token Information:")
            print(f"User: {token_info.get('user', {}).get('name')}")
            print(f"Account Type: {token_info.get('user', {}).get('account')}")
            print(f"Token Scopes: {token_info.get('scope', '')}")
            print("\nRequired Scopes:")
            print("✓ private - Required for managing private videos")
            print("✓ edit - Required for updating video settings")
            print("✓ video_files - Required for accessing video data")
            print("✓ public - Required for managing public/unlisted videos")
            
            # Check if we have all required scopes
            required_scopes = {'private', 'edit', 'video_files', 'public'}
            actual_scopes = set(token_info.get('scope', '').split(' '))
            missing_scopes = required_scopes - actual_scopes
            
            if missing_scopes:
                print("\n⚠️ Missing required scopes:")
                for scope in missing_scopes:
                    print(f"  - {scope}")
                print("\nPlease generate a new access token with these scopes at:")
                print("https://developer.vimeo.com/apps")
                print("\nSteps:")
                print("1. Go to your app settings")
                print("2. Under 'Authentication', select 'Generate an access token'")
                print("3. Check all the required scopes above")
                print("4. Generate the token and update your .env file with:")
                print("   VIMEO_ACCESS_TOKEN=your_new_token")
                return False
            
            print("\n✅ Token has all required scopes!")
            return True
        else:
            print(f"\n❌ Failed to verify token: {response.status_code}")
            print("Please check your authentication credentials:")
            print("1. VIMEO_CLIENT_ID")
            print("2. VIMEO_CLIENT_SECRET")
            print("3. VIMEO_ACCESS_TOKEN")
            print("\nMake sure these are set in your .env file and the values are correct.")
            return False
    except Exception as e:
        print(f"\n❌ Error verifying token: {str(e)}")
        print("Please ensure your .env file exists and contains valid credentials:")
        print("VIMEO_CLIENT_ID=your_client_id")
        print("VIMEO_CLIENT_SECRET=your_client_secret")
        print("VIMEO_ACCESS_TOKEN=your_access_token")
        return False

def main():
    # Initialize Vimeo client
    client = get_vimeo_client()
    if client is None:
        return
    
    try:
        # First verify token
        if not verify_token_scopes(client):
            return
            
        # Get all video IDs
        video_ids = get_all_video_ids()
        print(f"\nFound {len(video_ids)} videos to process")
        
        # Update privacy settings for each video
        success_count = 0
        for video_id in video_ids:
            if update_video_privacy(client, video_id):
                success_count += 1
            time.sleep(1)  # Add a small delay between requests to avoid rate limiting
        
        print(f"\n✅ Successfully updated {success_count} out of {len(video_ids)} videos")
        
    except Exception as e:
        print(f"❌ Error processing videos: {str(e)}")

if __name__ == "__main__":
    main() 